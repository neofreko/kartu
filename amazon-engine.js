module.exports = {
    name: 'amazonjp',
    filters: {
        subject: '/^Amazon.co.jp.*?の発送$/',
        from: 'ship-confirm@amazon.co.jp'
    },
    payloadExtractor: function(contexio_message_body, subject) {
        //console.log(contexio_message_body)
        var tracking_match = /お問い合わせ伝票番号は(.*?)です。/.exec(contexio_message_body.content)
        var logistic_match = /お客様の商品は(.*?)でお届けいたします。/.exec(contexio_message_body.content)
        var shohin = /^Amazon.co.jp\s*(.*?)\s*の発送$/.exec(subject)
        var link = false;
        switch (logistic_match[1]) {
            case 'ヤマト運輸':
            case 'ヤマト宅急便':
                link = 'http://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.NQ0010?id=' + tracking_match[1]
                break;
            case '福山通運':
                link = 'http://corp.fukutsu.co.jp/situation/tracking_no_hunt/' + tracking_match[1]
                break;
        }
        return tracking_match && logistic_match ? {
            title: 'Shipping notification',
            link: link,
            description: shohin[1] + '<br/>Shipped by ' + logistic_match[1] + '<br/>Tracking number: ' + tracking_match[1],
            raw_data: {
                logistic: logistic_match[1],
                tracking_number: tracking_match[1]
            }

        } : false
    }
}
