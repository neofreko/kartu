var Q = require('q')

module.exports = {
    name: 'asmart',
    filters: {
        subject: '/【アスマート】ご注文ありがとうございます。/',
        from: 'confirmation@asmart.jp'
    },
    payloadExtractor: function(contexio_message_body, subject) {
        //console.log(contexio_message_body)
        var is_paid = '/ 以下のご注文について、お客様からのご入金を確認致しましたので、ご連絡致します。/'.match(contexio_message_body.content)
        var result = /https:\/\/paysec\.aplc\.jp\/.*/.exec(contexio_message_body.content)
        var shohin = /商品名    ：(.*)/.exec(contexio_message_body.content)
        var order = /■ご注文番号：(.*)/.exec(contexio_message_body.content)
        //TODO handle is_paid and update relevant card record: eq remove image and change information to estimated arrival. eg: ★2月26日以降発送
        return result ? {
            title: 'New order ' + order[1],
            description: shohin[1],
            link: result[0]
        } : false
    },
    getStatus: function(link) {
        var request = require('request').defaults({
            jar: true
        }),
            cheerio = require('cheerio');

        var deferred = Q.defer();
        request({
            url: link,
            encoding: null,
            jar: true
        }, function(err, resp, body) {
            var Iconv = require('iconv').Iconv;
            console.log(resp.headers)
            //exit
            var iconv = new Iconv('CP932', 'UTF-8//TRANSLIT//IGNORE');
            $ = cheerio.load(iconv.convert(body).toString('utf8'));
            var form = $('form input[value="040"]').parents('form')
            var form_data = form.find('input[type="hidden"]')

            if (form.length == 0) {
                deferred.resolve({
                    is_final: true // no further updates required 
                })
                return
            }
            //console.log(form_data)
            //console.log('got data: ', form_data.length)


            var rform = {}
            form_data.each(function(i, el) {
                console.log('adding for data: ', $(this).attr('name'), $(this).val(), $(this).text())
                var val = $(this).val();
                if ($(this).attr('name') == 'hidden_payment_id')
                    val = '040';
                if ($(this).attr('name') == 'hidden_hid')
                    val = 'pcpost';
                rform[$(this).attr('name')] = val
            })

            rform['040.x'] = 42
            rform['040.y'] = 39
            rform['040'] = '040'
            console.log('https://paysec.aplc.jp' + form.attr('action'), rform)

            request.post({
                url: 'https://paysec.aplc.jp' + form.attr('action'),
                form: rform,
                headers: {
                    followRedirect: true,
                    followAllRedirects: true,
                    maxRedirects: 1000
                },
                jar: true
            }, function(err2, resp2, body2) {
                if (err2) throw err2;
                //console.log(resp2.headers);
                // FUCKIT, request module does not follow redirects
                if (resp2.headers.location) {
                    console.log('follow redirects: ', resp2.headers.location)
                    request.get({
                        url: 'https://paysec.aplc.jp' + resp2.headers.location,
                        jar: true
                    }, function(err3, resp3, body3) {
                        if (err3) throw err3;
                        //console.log(resp3.headers);
                        var html = iconv.convert(resp3.body).toString('utf8')
                        var img = /<img id="imgQR" src="(.*?)"/.exec(html)
                        //console.log(img)
                        deferred.resolve({
                            image: 'https://cvsshiharai.densan-s.co.jp/' + img[1],
                            is_final: true // no further updates required 
                        })
                    })
                }
            })

        });
        return deferred.promise;
    }
}