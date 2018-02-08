const express                      = require('express');
const dbCatch                      = require('../../lib/dbCatch');
const { embedParser, embedFilter } = require('../../lib/embedParser');

const router = new express.Router();

router.get('/services/deviceEssentials', (req, res, next) => {
    const models  = req.app.locals.models;
    const pointId = req.point.id;
    const now     = new Date();

    const embed = [
        {
            embed   : 'user',
            required: true
        },
        {
            embed  : 'user.meansOfLogin',
            filters: [['blocked', '=', false]]
        },
        {
            embed   : 'period',
            filters : [['end', '>', now]],
            required: true
        }
    ];

    const embedFilters = embed.filter(rel => rel.required).map(rel => rel.embed);

    models.Right
        .where({
            point_id: pointId
        })
        .fetchAll({
            withRelated: embedParser(embed)
        })
        .then(rights => embedFilter(embedFilters, rights.toJSON()))
        .then((rights) => {
            const users = [];

            rights.forEach((right) => {
                if (right.name === 'seller' || right.name === 'reloader' || right.name === 'assigner') {
                    const foundUserId    = users.findIndex(user => user.id === right.user.id);
                    const formattedRight = {
                        name : right.name,
                        start: right.period.start,
                        end  : right.period.end
                    };

                    if (foundUserId === -1) {
                        const newUser  = {
                            id          : right.user.id,
                            firstname   : right.user.firstname,
                            lastname    : right.user.lastname,
                            nickname    : right.user.nickname,
                            pin         : right.user.pin,
                            rights      : [formattedRight],
                            meansOfLogin: right.user.meansOfLogin.map(mol => ({
                                type: mol.type,
                                data: mol.data
                            }))
                        };

                        users.push(newUser);
                    } else {
                        const newUser = users[foundUserId];
                        newUser.rights.push(formattedRight);
                        users[foundUserId] = newUser;
                    }
                }
            });

            res
                .status(200)
                .json(users)
                .end();
        })
        .catch(err => dbCatch(module, err, next));
});

module.exports = router;
