var Q = require('q')

module.exports = {
    name: 'kuroneko',
    filters: {
        subject: '/宅急便お届けのお知らせ/',
        from: 'mail@kuronekoyamato.co.jp'
    },
    payloadExtractor: function(contexio_message_body, subject) {
        //console.log(contexio_message_body)

        var link, title, description
            title = 'ヤマト運輸'

            // is this a failed delivery?
        if (/再配達のご依頼/.test(contexio_message_body.content)) {
            var link_el = /(http:\/\/sneko2.kuronekoyamato.co.jp\/sneko2.*)/.exec(contexio_message_body.content)
            link = link_el[1]
            var desc_match = /(.*?ご不在でしたので持ち帰りました。)/.exec(contexio_message_body.content)
            var time_detail = /(\d+)月(\d+)日 (\d+)時(\d+)分/.exec(desc_match[1])
            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            description = 'Failed delivery at ' + months[parseInt(time_detail[1]) - 1] + '-' + time_detail[2] + ' ' + time_detail[3] + ':' + time_detail[4]
            title = 'Notice of failed delivery'
        } else {
            var tracking_match = /(http:\/\/toi\.kuronekoyamato\.co\.jp\/cgi-bin\/tneko\?.*)/.exec(contexio_message_body.content)
            var tracking_number = /no01=(.*?)&id/.exec(tracking_match[1])
            title = 'Shipping notification'
            description = 'Tracking number: ' + tracking_number[1]
            link = tracking_match[1]
        }
        return {
            title: title,
            description: description,
            link: link
        }
    },
    getStatus: function(link) {
        var request = require('request'),
            cheerio = require('cheerio');

        var deferred = Q.defer();
        request({
            url: link,
            encoding: null
        }, function(err, resp, body) {
            var Iconv = require('iconv').Iconv;
            var iconv = new Iconv('CP932', 'UTF-8//TRANSLIT//IGNORE');
            $ = cheerio.load(iconv.convert(body).toString('utf8'));
            meisai = $('table.meisai tr:last-child td')
            if (meisai.length == 0) {
                deferred.resolve({
                    is_final: true // no further updates required 
                })
                return
            }
            var status_date = new Date()
            var status = meisai.eq(1).text()
            var date_string = meisai.eq(2).text()
            var date_parts = /(\d+)\/(\d+)/.exec(date_string)
            var time_string = meisai.eq(3).text()
            var time_parts = /(\d+):(\d+)/.exec(time_string)
            var saigo_no_basho = meisai.eq(4).text()

            status_date.setMonth(parseInt(date_parts[1]))
            status_date.setDate(parseInt(date_parts[2]))
            status_date.setHours(parseInt(time_parts[1]))
            status_date.setMinutes(parseInt(time_parts[2]))
            status_date.setSeconds(0)

            var util = require('util')

            deferred.resolve({
                status: util.format('%s %s (%s)', status_date.toISOString().replace(/T/, ' ').replace(/\..+/, ''), status, saigo_no_basho),
                is_final: status == '配達完了' // no further updates required 
            })
        });
        return deferred.promise;
    }
}