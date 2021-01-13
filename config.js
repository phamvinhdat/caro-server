// these exports are for localhost and database mysql local
var exports_1 = {
    'client-domain': '//localhost:6969/',
    'server-domain': '//localhost:3000/',
    'database': {
        'host': 'localhost',
        'port': '3306',
        'user': 'root',
        'password': 'hung9xpro',
        'database': 'web-final-1612234'
    }
}

// these exports are for localhost and database remote
var exports_2 = {
    'client-domain': '//localhost:6969/',
    'server-domain': '//localhost:3000/',
    'database': {
        'host': 'sql12.freemysqlhosting.net',
        'port': '3306',
        'user': 'sql12308370',
        'password': 'xLicY5Js7i',
        'database': 'sql12308370'
    }
}

// these exports are for uploading to heroku
var exports_3 = {
    'client-domain': 'https://caro-1612234.herokuapp.com',
    'server-domain': 'https://caro-1612234-server.herokuapp.com',
    'secret-key': 'chouser_hung_jwt_secretkey',
    'mail-key': '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',
    'database': {
        'host': 'td5l74lo6615qq42.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
        'port': '3306',
        'user': 't0s0d1095tzfr9ib',
        'password': 'zkh1jjsf1hz90jy0',
        'database': 'avvwtqyvdenbs0f1'
    }
}

module.exports = exports_3;
