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

function get_current_sg_date() {
    return new Date().getTime();
}

function get_today_string() {
    var today = new Date(get_current_sg_date())
    return today.toLocaleDateString('en-SG').substr(0, 10)
}

function get_yesterday_string() {
    var today = get_current_sg_date()
    var yesterday = new Date(today - (3600000*24))
    return yesterday.toLocaleString('en-SG').substr(0, 10)
}

function get_tomorrow_string() {
    var today = get_current_sg_date()
    var yesterday = new Date(today + (3600000*24))
    return yesterday.toLocaleString('en-SG').substr(0, 10)
}

function get_current_month() {
    var today = get_today_string()
    var current_month = today.substr(3)
    return current_month
}

function get_current_week() {

}

function get_last_7_days() {

}

module.exports = {
    get_tomorrow_string,
    get_yesterday_string,
    get_today_string,
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