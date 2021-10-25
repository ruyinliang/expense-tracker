require('dotenv').config()
const fs = require('fs');

const Telegraf = require('telegraf').Telegraf;
const data_bot = new Telegraf(process.env.TELEGRAM_DATA_BOT_TOKEN);
const DBSOURCE = process.env.DBSOURCE
const sqlite3 = require('sqlite3').verbose();
const {
    group_by,
    get_sum,
    insert_data_to_db,
    read_db_data,
    get_current_month
} = require('./utils.js')
const {
    READ_LAST_7_DAYS_RECORDS,
    READ_CURRENT_MONTH_RECORDS,
    READ_CURRENT_MONTH_TARGET,
    INSERT_NEW_TARGET
} = require('./sql.js')

const months = {
    'jan' : '01',
    'feb' : '02',
    'mar' : '03',
    'apr' : '04',
    'may' : '05',
    'jun' : '06',
    'jul' : '07',
    'aug' : '08',
    'sep' : '09',
    'oct' : '10',
    'nov' : '11',
    'dec' : '12'
}

let db = new sqlite3.Database(DBSOURCE, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message)
        return
    }
    console.log('Connected to SQlite database.');
});

data_bot.hears(/^target\W+(\d+)$/, async ctx => {
    const target = ctx.match[1].trim()
    const current_month = get_current_month()
    const data = []
    await insert_data_to_db(db, INSERT_NEW_TARGET, [current_month, target])
})

data_bot.hears(/^7$/, async ctx => {
    let last_7_days_records = group_by(await read_db_data(db, READ_LAST_7_DAYS_RECORDS, []), 'Date')
    let last_7_days_records_str = "<b>Bills</b>\n=============================\n"

    for (const [date, items] of Object.entries(last_7_days_records)) {
        last_7_days_records_str = last_7_days_records_str.concat(`<b>${date}</b>`, "\n")
        items.forEach(item => {
            last_7_days_records_str = last_7_days_records_str.concat(item['Category'], ', ', item['Description'], ', ', '$', item['Amount'], "\n")
        })
        last_7_days_records_str = last_7_days_records_str.concat("=============================\n")
    }
    data_bot.telegram.sendMessage(ctx.chat.id, last_7_days_records_str, {parse_mode: 'HTML'})
})

data_bot.hears(/^jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec$/, async ctx => {
    const month = months[ctx.match[0].trim()] + "/" + new Date().getFullYear().toString()
    const expense_details_by_month = await get_expense_by_month(READ_CURRENT_MONTH_RECORDS, month, ctx)
    const amount_sum_by_month = get_sum(expense_details_by_month)
    const category_details = group_by(expense_details_by_month, 'Category')
    let category_details_copy = JSON.parse(JSON.stringify(category_details));
    for (const [category, items] of Object.entries(category_details_copy)) {
        let sum_total_int = get_sum(items)
        category_details_copy[category] = sum_total_int
    }
    const current_month = get_current_month()
    const current_month_target = await get_current_month_target(current_month)
    data_bot.telegram.sendMessage(ctx.chat.id, `You have spent ${amount_sum_by_month}/${current_month_target} in ${month}`)
    data_bot.telegram.sendMessage(ctx.chat.id,
        `<b>Auto</b>: $${category_details_copy['Auto']}, ${category_details['Auto'].length}, ${(100*(category_details_copy['Auto']/amount_sum_by_month)).toFixed(2)}%\n<b>Food</b>: $${category_details_copy['Food']}, ${category_details['Food'].length}, ${(100*(category_details_copy['Food']/amount_sum_by_month)).toFixed(2)}%\n<b>交通</b>: $${category_details_copy['交通']}, ${category_details['交通'].length}, ${(100*(category_details_copy['交通']/amount_sum_by_month)).toFixed(2)}%\n<b>日常用品</b>: $${category_details_copy['日常用品']}, ${category_details['日常用品'].length}, ${(100*(category_details_copy['日常用品']/amount_sum_by_month)).toFixed(2)}%\n<b>餐厅</b>: $${category_details_copy['餐厅']}, ${category_details['餐厅'].length}, ${(100*(category_details_copy['餐厅']/amount_sum_by_month)).toFixed(2)}%`, {parse_mode: 'HTML'}
    )
})

const get_expense_by_month = async (get_by_month_command, month, ctx) => {
    const expenses = await read_db_data(db, get_by_month_command, month)
    return expenses
}

const get_current_month_target = async current_month => {
    let target = await read_db_data(db, READ_CURRENT_MONTH_TARGET, current_month)
    target = target[0]['Target']
    return target
}

data_bot.launch();

process.once('SIGINT', () => data_bot.stop('SIGINT'))
process.once('SIGTERM', () => data_bot.stop('SIGTERM'))
