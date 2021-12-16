require('dotenv').config()
const Telegraf = require('telegraf').Telegraf;
const testing_bot = new Telegraf(process.env.TELEGRAM_TESTING_BOT_TOKEN);
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

testing_bot.hears(/^test$/, ctx => {
    testing_bot.telegram.sendMessage(ctx.chat.id, 'testing')
})

testing_bot.launch();

process.once('SIGINT', () => testing_bot.stop('SIGINT'))
process.once('SIGTERM', () => testing_bot.stop('SIGTERM'))
