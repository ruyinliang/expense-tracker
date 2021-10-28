let insert_data_to_db = async (db, sql_command, params) => {
    await db.run(sql_command, params, (err, rows) => {
        if (err) {
            console.log(err.message)
            return;
        }
    })
}

let read_db_data = (db, sql_command, params) => {
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

let group_by = (xs, key) => {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

let get_sum = (list, key) => {
    return list.reduce((partial_sum, current) => partial_sum + current[key], 0)
}

let get_current_sg_date = () => {
    return new Date().getTime();
}

let get_today_string = () => {
    var today = new Date(get_current_sg_date())
    return today.toLocaleDateString('en-SG').substr(0, 10)
}

let get_yesterday_string = () => {
    var today = get_current_sg_date()
    var yesterday = new Date(today - (3600000*24))
    return yesterday.toLocaleString('en-SG').substr(0, 10)
}

let get_tomorrow_string = () => {
    var today = get_current_sg_date()
    var yesterday = new Date(today + (3600000*24))
    return yesterday.toLocaleString('en-SG').substr(0, 10)
}

let get_current_month = () => {
    var today = get_today_string()
    var current_month = today.substr(3)
    return current_month
}

let get_current_year = () => {
    var today = get_today_string()
    var current_year = today.substr(6)
    return current_year
}

module.exports = {
    get_tomorrow_string,
    get_yesterday_string,
    get_today_string,
    get_current_month,
    get_current_year,
    group_by,
    get_sum,
    insert_data_to_db,
    read_db_data
};