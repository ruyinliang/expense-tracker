require('dotenv').config()
const Telegraf = require('telegraf').Telegraf;
const entry_bot = new Telegraf(process.env.TELEGRAM_ENTRY_BOT_TOKEN);
const DBSOURCE = process.env.DBSOURCE
const sqlite3 = require('sqlite3').verbose();
const {
    get_today_string,
    get_tomorrow_string,
    get_yesterday_string,
    insert_data_to_db
} = require('./utils.js')
const {
    INSERT_NEW_RECORD
} = require('./sql.js')

let db = new sqlite3.Database(DBSOURCE, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message)
        return
    }
    console.log('Connected to SQlite database.');
});

var current_expense_detail = []
var first_time_here = true

entry_bot.command('clear', ctx => {
    first_time_here = true
    current_expense_detail = []
})

entry_bot.hears(/^.+$/, ctx => {
    if (ctx.message.from.id != process.env.TELEGRAM_USER_ID) {
        entry_bot.telegram.sendMessage(ctx.chat.id, 'you don\'t belong here. *casted out of the deep forest*')
        return
    }
    current_expense_detail.push(ctx.match[0].trim())
    console.log(current_expense_detail)
    if (first_time_here && current_expense_detail.length == 2) {
        first_time_here = false
        entry_bot.telegram.sendMessage(ctx.chat.id, 'which potion do you want?', {
             reply_markup: {
                inline_keyboard: [
                    [{text: "Food", callback_data: 'Food'}],
                    [{text: "交通", callback_data: '交通'}],
                    [{text: "日常用品", callback_data: '日常用品'}],
                    [{text: "诊所", callback_data: '诊所'}],
                    [{text: "餐厅", callback_data: '餐厅'}],
                    [{text: "没用的玩意", callback_data: '没用的玩意'}]
                ]
            }
        })
    }
})

entry_bot.action(/^交通|Food|餐厅|日常用品|诊所|没用的玩意$/, ctx => {
    current_expense_detail.push(ctx.match[0].trim())
    console.log(current_expense_detail)
    if (!first_time_here && current_expense_detail.length == 3) {
        entry_bot.telegram.sendMessage(ctx.chat.id, 'are you ready for this?', {
            reply_markup: {
                inline_keyboard: [
                    [{text: "sure", callback_data: 'done'}],
                    [{text: "what was the plan again?", callback_data: 'add_date'}],
                ]
            }
        })
    }
})


entry_bot.action('add_date', ctx => {
    entry_bot.telegram.sendMessage(ctx.chat.id, 'Put that obsidian down!', {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: 'okok. I won\'t cause any trouble',
                    callback_data: 'add_ytd'
                },
                {
                    text: 'they won\'t find out',
                    callback_data: 'add_tmr'
                }
                ],

            ]
        }
    })
})

entry_bot.action('add_tmr', async ctx => {
    const tomorrow = get_tomorrow_string()
    current_expense_detail.push(tomorrow)
    console.log(current_expense_detail)
    await add_expense_to_db(current_expense_detail, ctx)
    entry_bot.telegram.sendMessage(ctx.chat.id, 'the gnome is looking at you suspiciously')
})

entry_bot.action('add_ytd', async ctx => {
    const yesterday = get_yesterday_string()
    current_expense_detail.push(yesterday)
    console.log(current_expense_detail)
    await add_expense_to_db(current_expense_detail, ctx)
    entry_bot.telegram.sendMessage(ctx.chat.id, 'the gnome is looking at you suspiciously')
})

entry_bot.action('done', async ctx => {
    const today = get_today_string()
    current_expense_detail.push(today)
    console.log(current_expense_detail)
    await add_expense_to_db(current_expense_detail, ctx)
    entry_bot.telegram.sendMessage(ctx.chat.id, 'the gnome is looking at you suspiciously')
})

async function add_expense_to_db(params, ctx) {
    entry_bot.telegram.sendMessage(ctx.chat.id, 'bribing locksmith')
    await insert_data_to_db(db, INSERT_NEW_RECORD, params)
    entry_bot.telegram.sendMessage(ctx.chat.id, '*hiding the gold inside the cloak*')
    first_time_here = true
    current_expense_detail = []
}


entry_bot.launch();

process.once('SIGINT', () => entry_bot.stop('SIGINT'))
process.once('SIGTERM', () => entry_bot.stop('SIGTERM'))