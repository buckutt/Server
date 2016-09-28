import models from '../src/models';

// Shim for values
Object.values = obj => Object.keys(obj).map(key => obj[key]);

const seeder = {
    raw: () => {
        /* Articles */
        const articleKinderDelice = new models.Article({
            name : 'Kinder Delice',
            stock: 100
        });

        const articleMars = new models.Article({
            name : 'Mars',
            stock: 100
        });

        const articleKinderCountry = new models.Article({
            name : 'Kinder Country',
            stock: 100
        });

        const articleIceTeaPeche = new models.Article({
            name : 'Ice Tea Pêche',
            stock: 100
        });

        const articleEau = new models.Article({
            name : 'Eau',
            stock: 100
        });

        const articleIceTeaMangue = new models.Article({
            name : 'Ice Tea Mangue',
            stock: 100
        });

        const articleLiptonic = new models.Article({
            name : 'Liptonic',
            stock: 100
        });

        const articleSchweppes = new models.Article({
            name : 'Schweppes',
            stock: 100
        });

        const articleSchweppesAgrum = new models.Article({
            name : 'Schweppes Agrum',
            stock: 100
        });

        const articleCocaCola = new models.Article({
            name : 'Coca-Cola',
            stock: 100
        });

        const articleCrepe = new models.Article({
            name : 'Crêpe',
            stock: 100
        });

        const articleBeer = new models.Article({
            name   : 'Bière',
            alcohol: 1,
            stock  : 100
        });

        /* Categories */
        const categoryBarres = new models.Category({
            name: 'Barres'
        });

        const categoryCanettes = new models.Category({
            name: 'Canettes'
        });

        const categoryGeneral = new models.Category({
            name: 'Général'
        });

        /* Devices */
        const deviceEeetop1 = new models.Device({
            fingerprint     : 'DA39A3EE5E6B4B0D3255BFEF95601890AFD80709',
            name            : 'Eeetop1',
            doubleValidation: true,
            offlineSupport  : true,
            showPicture     : true,
            showCategories  : false
        });

        const deviceEeetop2 = new models.Device({
            fingerprint     : '43827897F391A51F23081BAFF7D15C7105D653AD',
            name            : 'Eeetop2',
            doubleValidation: true,
            offlineSupport  : true,
            showPicture     : true,
            showCategories  : false
        });

        /* Fundations */
        const fundationUng = new models.Fundation({
            name   : 'UNG',
            website: 'http://ung.utt.fr/',
            mail   : 'ung@utt.fr'
        });

        const fundationFoyer = new models.Fundation({
            name   : 'Foyer',
            website: 'http://utt.fr/',
            mail   : 'foyer@utt.fr'
        });

        const fundationBde = new models.Fundation({
            name   : 'BDE',
            website: 'http://bde.utt.fr/',
            mail   : 'bde@utt.fr'
        });

        /* Groups */

        const groupCotisants = new models.Group({
            name    : 'Cotisants',
            isOpen  : true,
            isPublic: false
        });

        const groupNonCotisants = new models.Group({
            name    : 'Non Cotisants',
            isOpen  : true,
            isPublic: false
        });

        /* MeanOfLogin */
        const molGJEtuCard = new models.MeanOfLogin({
            type: 'etuId',
            data: '22000000353423'
        });

        const molGJEtuMail = new models.MeanOfLogin({
            type: 'etuMail',
            data: 'gabriel.juchault@utt.fr'
        });

        /* MeanOfPayment */
        const meanofpaymentCard = new models.MeanOfPayment({
            slug: 'card',
            name: 'Carte'
        });

        const meanofpaymentCash = new models.MeanOfPayment({
            slug: 'cash',
            name: 'Liquide'
        });

        const meanofpaymentCheque = new models.MeanOfPayment({
            slug: 'cheque',
            name: 'Chèque'
        });

        const meanofpaymentGobby = new models.MeanOfPayment({
            slug: 'gobby',
            name: 'Gobby',
            step: 1
        });

        /* Periods */
        const periodEternity = new models.Period({
            name : 'Éternité',
            start: new Date(0),
            end  : new Date(21474000000000)
        });

        const periodPrevious = new models.Period({
            name : 'Avant',
            start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 5),
            end  : new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 3)
        });

        const periodAfter = new models.Period({
            name : 'Après',
            start: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 3),
            end  : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 5)
        });

        const periodNow = new models.Period({
            name : 'Maintenant',
            start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 2),
            end  : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 2)
        });

        /* Points */
        const pointBde = new models.Point({
            name: 'BDE'
        });

        const pointFoyer = new models.Point({
            name: 'Foyer'
        });

        /* PeriodPoint */
        const periodPointEternityForEEtop1BDE   = new models.PeriodPoint({});
        const periodPointEternityForEEtop2Foyer = new models.PeriodPoint({});

        /* Prices */
        const price50 = new models.Price({
            amount: 50
        });

        const price100F1E = new models.Price({
            amount: 100
        });

        const price1003C = new models.Price({
            amount: 100
        });

        const price250 = new models.Price({
            amount: 250
        });

        /* Promotions */
        const promotionF1e = new models.Promotion({
            name: 'Formule 1€'
        });

        const promotion3crepes = new models.Promotion({
            name: '3 Crêpes'
        });

        /* Rights */
        const rightGJAdmin = new models.Right({
            name: 'admin'
        });

        const rightGJSeller = new models.Right({
            name: 'seller'
        });

        /* Sets */
        const setBarresf1e = new models.Set({
            name: 'Barres Formule 1€'
        });

        const setCanettesf1e = new models.Set({
            name: 'Canettes Formule 1€'
        });

        /* Users */
        const userGJ = new models.User({
            firstname  : 'Gabriel',
            lastname   : 'Juchault',
            nickname   : 'Extaze',
            pin        : '$2a$12$9w5Riq5qbjyhZ5.JD.72LOqlgAP2161QLkk9mDyvF/NNSx.2PGww6',
            password   : '$2a$12$aqJWiCvjD.azTpE2krKu3.1GDLHApaE.hfz2BM8pIeil.OJ1khST.',
            mail       : 'gabriel.juchault@utt.fr',
            credit     : 1200,
            isTemporary: false
        });

        const articles = {
            articleKinderDelice,
            articleMars,
            articleKinderCountry,
            articleIceTeaPeche,
            articleEau,
            articleIceTeaMangue,
            articleLiptonic,
            articleSchweppes,
            articleSchweppesAgrum,
            articleCocaCola,
            articleCrepe,
            articleBeer
        };

        const categories = {
            categoryBarres,
            categoryCanettes,
            categoryGeneral
        };

        const devices = {
            deviceEeetop1,
            deviceEeetop2
        };

        const fundations = {
            fundationUng,
            fundationFoyer,
            fundationBde
        };

        const groups = {
            groupCotisants,
            groupNonCotisants
        };

        const meansOfLogin = {
            molGJEtuCard,
            molGJEtuMail
        };

        const meansOfPayment = {
            meanofpaymentCard,
            meanofpaymentCash,
            meanofpaymentCheque,
            meanofpaymentGobby
        };

        const periods = {
            periodEternity,
            periodPrevious,
            periodAfter,
            periodNow
        };

        const periodPoints = {
            periodPointEternityForEEtop1BDE,
            periodPointEternityForEEtop2Foyer
        };

        const points = {
            pointBde,
            pointFoyer
        };

        const prices = {
            price50,
            price100F1E,
            price1003C,
            price250
        };

        const promotions = {
            promotionF1e,
            promotion3crepes
        };

        const rights = {
            rightGJAdmin,
            rightGJSeller
        };

        const sets = {
            setBarresf1e,
            setCanettesf1e
        };

        const users = {
            userGJ
        };

        const all = Object.values(articles)
            .concat(Object.values(categories))
            .concat(Object.values(devices))
            .concat(Object.values(fundations))
            .concat(Object.values(groups))
            .concat(Object.values(meansOfLogin))
            .concat(Object.values(meansOfPayment))
            .concat(Object.values(periods))
            .concat(Object.values(periodPoints))
            .concat(Object.values(points))
            .concat(Object.values(prices))
            .concat(Object.values(promotions))
            .concat(Object.values(rights))
            .concat(Object.values(sets))
            .concat(Object.values(users));

        const data = {
            articles,
            categories,
            devices,
            fundations,
            groups,
            meansOfLogin,
            meansOfPayment,
            periods,
            periodPoints,
            points,
            prices,
            promotions,
            rights,
            sets,
            users
        };

        return {
            data,
            all
        };
    },
    rels: data => {
        const arr = [];

        /* Articles - Relationships : cateogries, point, price, sets, promotion */
        data.articles.articleKinderDelice.prices     = [ data.prices.price50 ];
        data.articles.articleKinderDelice.sets       = [ data.sets.setBarresf1e ];
        data.articles.articleKinderDelice.categories = [ data.categories.categoryBarres.id ];
        arr.push(data.articles.articleKinderDelice.saveAll({
            categories: true,
            prices    : true,
            sets      : true
        }));

        data.articles.articleMars.prices     = [ data.prices.price50 ];
        data.articles.articleMars.sets       = [ data.sets.setBarresf1e ];
        data.articles.articleMars.categories = [ data.categories.categoryBarres.id ];
        arr.push(data.articles.articleMars.saveAll({
            categories: true,
            prices    : true,
            sets      : true
        }));

        data.articles.articleKinderCountry.prices     = [ data.prices.price50 ];
        data.articles.articleKinderCountry.sets       = [ data.sets.setBarresf1e ];
        data.articles.articleKinderCountry.categories = [ data.categories.categoryBarres.id ];
        arr.push(data.articles.articleKinderCountry.saveAll({
            categories: true,
            prices    : true,
            sets      : true
        }));

        data.articles.articleIceTeaPeche.prices     = [ data.prices.price50 ];
        data.articles.articleIceTeaPeche.sets       = [ data.sets.setCanettesf1e ];
        data.articles.articleIceTeaPeche.categories = [ data.categories.categoryCanettes.id ];
        arr.push(data.articles.articleIceTeaPeche.saveAll({
            categories: true,
            prices    : true,
            sets      : true
        }));

        data.articles.articleEau.prices     = [ data.prices.price50 ];
        data.articles.articleEau.categories = [ data.categories.categoryGeneral.id ];
        arr.push(data.articles.articleEau.saveAll({
            categories: true,
            prices    : true
        }));

        data.articles.articleIceTeaMangue.prices     = [ data.prices.price50 ];
        data.articles.articleIceTeaMangue.sets       = [ data.sets.setCanettesf1e ];
        data.articles.articleIceTeaMangue.categories = [ data.categories.categoryCanettes.id ];
        arr.push(data.articles.articleIceTeaMangue.saveAll({
            categories: true,
            prices    : true,
            sets      : true
        }));

        data.articles.articleLiptonic.prices     = [ data.prices.price50 ];
        data.articles.articleLiptonic.sets       = [ data.sets.setCanettesf1e ];
        data.articles.articleLiptonic.categories = [ data.categories.categoryCanettes.id ];
        arr.push(data.articles.articleLiptonic.saveAll({
            categories: true,
            prices    : true,
            sets      : true
        }));

        data.articles.articleSchweppes.prices     = [ data.prices.price50 ];
        data.articles.articleSchweppes.sets       = [ data.sets.setCanettesf1e ];
        data.articles.articleSchweppes.categories = [ data.categories.categoryCanettes.id ];
        arr.push(data.articles.articleSchweppes.saveAll({
            categories: true,
            prices    : true,
            sets      : true
        }));

        data.articles.articleSchweppesAgrum.prices     = [ data.prices.price50 ];
        data.articles.articleSchweppesAgrum.sets       = [ data.sets.setCanettesf1e ];
        data.articles.articleSchweppesAgrum.categories = [ data.categories.categoryCanettes.id ];
        arr.push(data.articles.articleSchweppesAgrum.saveAll({
            categories: true,
            prices    : true,
            sets      : true
        }));

        data.articles.articleCocaCola.prices     = [ data.prices.price50 ];
        data.articles.articleCocaCola.sets       = [ data.sets.setCanettesf1e ];
        data.articles.articleCocaCola.categories = [ data.categories.categoryCanettes.id ];
        arr.push(data.articles.articleCocaCola.saveAll({
            categories: true,
            prices    : true,
            sets      : true
        }));

        data.articles.articleCrepe.prices     = [ data.prices.price50 ];
        data.articles.articleCrepe.categories = [ data.categories.categoryGeneral.id ];
        arr.push(data.articles.articleCrepe.saveAll({
            categories: true,
            prices    : true
        }));

        data.articles.articleBeer.prices     = [ data.prices.price250 ];
        data.articles.articleBeer.categories = [ data.categories.categoryGeneral.id ];
        arr.push(data.articles.articleBeer.saveAll({
            categories: true,
            prices    : true
        }));

        /* Category - Relationships : points, articles */

        /* Devices - Relationships : periodPoints */
        data.devices.deviceEeetop1.periodPoints = [ data.periodPoints.periodPointEternityForEEtop1BDE ];
        arr.push(data.devices.deviceEeetop1.saveAll({
            periodPoints: true
        }));

        data.devices.deviceEeetop2.periodPoints = [ data.periodPoints.periodPointEternityForEEtop2Foyer ];
        arr.push(data.devices.deviceEeetop2.saveAll({
            periodPoints: true
        }));

        /* Fundations - Relationships : prices, purchases */

        /* Groups - Relationships : users, prices */
        data.groups.groupCotisants.users  = [ data.users.userGJ ];
        arr.push(data.groups.groupCotisants.saveAll({
            users: true
        }));

        /* MeansOfLogin - Relationships : user */
        data.meansOfLogin.molGJEtuCard.User_id = data.users.userGJ.id;
        arr.push(data.meansOfLogin.molGJEtuCard.save());

        data.meansOfLogin.molGJEtuMail.User_id = data.users.userGJ.id;
        arr.push(data.meansOfLogin.molGJEtuMail.save());

        /* Periods - Relationships : periodPoints, prices, rights */

        /* PeriodPoints - Relationships : point, period, devices */
        data.periodPoints.periodPointEternityForEEtop1BDE.Period_id = data.periods.periodEternity.id;
        data.periodPoints.periodPointEternityForEEtop1BDE.Point_id  = data.points.pointBde.id;
        arr.push(data.periodPoints.periodPointEternityForEEtop1BDE.save());

        data.periodPoints.periodPointEternityForEEtop2Foyer.Period_id = data.periods.periodEternity.id;
        data.periodPoints.periodPointEternityForEEtop2Foyer.Point_id  = data.points.pointFoyer.id;
        arr.push(data.periodPoints.periodPointEternityForEEtop2Foyer.save());

        /* Points - Relationships : periodPoints, articles, promotions, purchases, reloads */
        data.points.pointFoyer.categories = [
            data.categories.categoryGeneral,
            data.categories.categoryCanettes,
            data.categories.categoryBarres
        ];
        data.points.pointFoyer.prices = [
            data.prices.price50,
            data.prices.price100F1E,
            data.prices.price1003C,
            data.prices.price250
        ];
        arr.push(data.points.pointFoyer.saveAll({
            articles  : true,
            categories: true,
            prices    : true
        }));

        /* Prices - Relationships : fundation, group, period, articles, promotion */
        data.prices.price50.Fundation_id = data.fundations.fundationFoyer.id;
        data.prices.price50.Group_id     = data.groups.groupCotisants.id;
        data.prices.price50.Period_id    = data.periods.periodEternity.id;
        data.prices.price50.articles = [
            data.articles.articleMars,
            data.articles.articleKinderCountry,
            data.articles.articleIceTeaPeche,
            data.articles.articleEau,
            data.articles.articleIceTeaMangue,
            data.articles.articleLiptonic,
            data.articles.articleSchweppes
        ];
        arr.push(data.prices.price50.saveAll({
            articles: true
        }));

        data.prices.price100F1E.Fundation_id = data.fundations.fundationFoyer.id;
        data.prices.price100F1E.Group_id     = data.groups.groupCotisants.id;
        data.prices.price100F1E.Period_id    = data.periods.periodEternity.id;
        arr.push(data.prices.price100F1E.save());

        data.prices.price1003C.Fundation_id = data.fundations.fundationFoyer.id;
        data.prices.price1003C.Group_id     = data.groups.groupCotisants.id;
        data.prices.price1003C.Period_id    = data.periods.periodEternity.id;
        arr.push(data.prices.price1003C.save());

        data.prices.price250.Fundation_id = data.fundations.fundationFoyer.id;
        data.prices.price250.Group_id     = data.groups.groupCotisants.id;
        data.prices.price250.Period_id    = data.periods.periodEternity.id;
        data.prices.price250.articles    = [ data.articles.articleBeer ];
        arr.push(data.prices.price250.saveAll({
            articles: true
        }));

        /* Promotions - Relationships : point, price, articles, sets */
        data.promotions.promotionF1e.sets = [
            data.sets.setBarresf1e,
            data.sets.setCanettesf1e
        ];
        data.promotions.promotionF1e.prices = [ data.prices.price100F1E ];
        arr.push(data.promotions.promotionF1e.saveAll({
            prices: true,
            sets  : true
        }));

        data.promotions.promotion3crepes.prices = [ data.prices.price1003C ];
        arr.push(data.promotions.promotion3crepes.saveAll({
            prices: true
        }));

        /* Rights - Relationships : point, period, users */
        data.rights.rightGJAdmin.Point_id  = data.points.pointFoyer.id;
        data.rights.rightGJAdmin.Period_id = data.periods.periodNow.id;
        data.rights.rightGJAdmin.users     = [ data.users.userGJ ];
        arr.push(data.rights.rightGJAdmin.saveAll({
            users: true
        }));

        data.rights.rightGJSeller.Point_id  = data.points.pointFoyer.id;
        data.rights.rightGJSeller.Period_id = data.periods.periodNow.id;
        data.rights.rightGJSeller.users     = [ data.users.userGJ ];
        arr.push(data.rights.rightGJSeller.saveAll({
            users: true
        }));

        /* Users - Relationships : groups, rights, meansOfLogin */

        return arr;
    },
    post: data => {
        const r                = models.r;
        const ArticlePromotion = models.Promotion._joins.articles.link;
        return r.table(ArticlePromotion).insert([
            { Article_id: data.articles.articleCrepe.id, Promotion_id: data.promotions.promotion3crepes.id },
            { Article_id: data.articles.articleCrepe.id, Promotion_id: data.promotions.promotion3crepes.id },
            { Article_id: data.articles.articleCrepe.id, Promotion_id: data.promotions.promotion3crepes.id }
        ]).run();
    }
};

models.loadModels().then(() => {
    const raw = seeder.raw();

    Promise
        .all(raw.all.map(document => document.save()))
        .then(() => {
            console.log('Inserted documents');
            return Promise.all(seeder.rels(raw.data));
        })
        .then(() => seeder.post(raw.data))
        .then(() => {
            console.log('Inserted relationships. Press Ctrl+C to exit');
        })
        .catch((err) => {
            console.log(err.stack);
        });
});
