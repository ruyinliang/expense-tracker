function read_month_expenses_sql() {
    return "select * from Expenses where strftime('%m/%Y', strftime('%Y-%m-%d',datetime(substr(Date, 7, 4) || '-' || substr(Date, 4, 2) || '-' || substr(Date, 1, 2)))) is ?"
}

function insert_expense_sql() {
    return "INSERT INTO Expenses (Amount, Description, Category, Date) VALUES(?,?,?,?)"
}

function insert_target_sql() {
    return "INSERT INTO Targets (Date, Target) VALUES(?, ?);"
}

function get_month_target_sql() {
    return "select * from Targets where Date like ?;"
}

async function insert_data_to_db(db, sql_command, params) {
    await db.run(sql_command, params, (err, rows) => {
        if (err) {
            console.log(err.message)
            return;
        }
    })
}

function read_db_data(db, sql_command, params) {
    data = []
    return new Promise(resolve => {
        db.all(sql_command, params, function(err, rows) {
            if (err) {
                console.log(err.message)
                return;
            }
            rows.forEach((row)=>{
                data.push(row);
            });

            resolve(data);
        });
    })
}

var group_by = function(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

var get_sum = function(list) {
    return list.reduce((partial_sum, current) => partial_sum + current['Amount'], 0).toFixed(2)
}

function get_current_date() {
    var today = new Date()
    var utc = today.getTime() + (today.getTimezoneOffset() * 60000);
    var today = new Date(utc + (3600000*8));
    today = today.toLocaleDateString('en-SG').substr(0, 10)
    return today
}

function get_yesterday() {
    var today = new Date();
    var utc = today.getTime() + (today.getTimezoneOffset() * 60000);
    var today = (new Date(utc + (3600000*8)));
    var yesterday = (new Date(utc + (3600000*8)));
    yesterday.setDate(today.getDate() - 1)
    yesterday = yesterday.toLocaleString('en-SG').substr(0, 10)
    return yesterday
}

function get_tomorrow() {
    var today = new Date();
    var utc = today.getTime() + (today.getTimezoneOffset() * 60000);
    var today = (new Date(utc + (3600000*8)));
    var tomorrow = (new Date(utc + (3600000*8)));
    tomorrow.setDate(today.getDate() + 1)
    tomorrow = tomorrow.toLocaleString('en-SG').substr(0, 10)
    return tomorrow
}

function get_current_month() {
    var today = new Date()
    today = today.toLocaleDateString('en-SG')
    today = today.substr(3)
    return today
}

function get_current_week() {

}

function get_last_7_days() {

}

module.exports = {
    get_tomorrow,
    get_yesterday,
    get_current_date,
    get_current_month,
    read_month_expenses_sql,
    group_by,
    get_sum,
    insert_expense_sql,
    insert_data_to_db,
    insert_target_sql,
    read_db_data,
    get_month_target_sql
};