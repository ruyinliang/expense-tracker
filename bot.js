require('dotenv').config()

const Telegraf = require('telegraf').Telegraf;
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const DBSOURCE = process.env.DBSOURCE
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database(DBSOURCE, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message)
        return
    }
    console.log('Connected to SQlite database.');
});

var current_expense_detail = []
var first_time_here = true

bot.command('clear', ctx => {
    first_time_here = true
    current_expense_detail = []
})

bot.hears(/^.+$/, ctx => {
    if (ctx.message.from.id != process.env.TELEGRAM_USER_ID) {
        bot.telegram.sendMessage(ctx.chat.id, 'you don\'t belong here. *casted out of the deep forest*')
        return
    }
    current_expense_detail.push(ctx.match[0].trim())
    console.log(current_expense_detail)
    if (first_time_here && current_expense_detail.length == 2) {
        first_time_here = false
        bot.telegram.sendMessage(ctx.chat.id, 'which potion do you want?', {
             reply_markup: {
                inline_keyboard: [
                    [{text: "Food", callback_data: 'Food'}],
                    [{text: "交通", callback_data: '交通'}],
                    [{text: "日常用品", callback_data: '日常用品'}],
                    [{text: "诊所", callback_data: '诊所'}],
                    [{text: "餐厅", callback_data: '餐厅'}],
                ]
            }
        })
    }
})

bot.action(/^交通|Food|餐厅|日常用品|诊所$/, ctx => {
    current_expense_detail.push(ctx.match[0].trim())
    console.log(current_expense_detail)
    if (!first_time_here && current_expense_detail.length == 3) {
        bot.telegram.sendMessage(ctx.chat.id, 'are you ready for this?', {
            reply_markup: {
                inline_keyboard: [
                    [{text: "sure", callback_data: 'done'}],
                    [{text: "what was the plan again?", callback_data: 'add_date'}],
                ]
            }
        })
    }
})


bot.action('add_date', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, 'Put that obsidian down!', {
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

bot.action('add_tmr', ctx => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    current_expense_detail.push(tomorrow.toLocaleDateString('en-GB'))
    console.log(current_expense_detail)
    insert_data_to_db(current_expense_detail)
    bot.telegram.sendMessage(ctx.chat.id, 'the gnome is looking at you suspiciously')
})

bot.action('add_ytd', ctx => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    current_expense_detail.push(yesterday.toLocaleDateString('en-SG'))
    console.log(current_expense_detail)
    insert_data_to_db(current_expense_detail)
    bot.telegram.sendMessage(ctx.chat.id, 'the gnome is looking at you suspiciously')
})

bot.action('done', ctx => {
    current_expense_detail.push(new Date().toLocaleDateString('en-SG'))
    console.log(current_expense_detail)
    insert_data_to_db(current_expense_detail, ctx)
    bot.telegram.sendMessage(ctx.chat.id, 'the gnome is looking at you suspiciously')
})

async function insert_data_to_db(payload, ctx) {
    bot.telegram.sendMessage(ctx.chat.id, 'bribing locksmith')
    var sql = "INSERT INTO Expenses (Amount, Description, Category, Date) VALUES(?,?,?,?)"
    await db.run(sql, payload, (err, rows) => {
        if (err) {
            console.log(err.message)
            bot.telegram.sendMessage(ctx.chat.id, 'they found you. seems like the transformation potion lasts shroter for humans:(')
            return;
        }
        first_time_here = true
        current_expense_detail = []
        bot.telegram.sendMessage(ctx.chat.id, '*hiding the gold inside the cloak*')
    });
}


bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))