module.exports = (item) => {
    if (item.cost === 0) {
        return 0;
    }

    if (!item.Promotion_id) {
        return item.articles[0].vat * item.cost;
    }

    const withoutTax = item.articles.map(article => article.cost);

    const sumWithoutTax = withoutTax.reduce((a, b) => a + b, 0);

    const relatives = item
        .articles
        .map(article => article.cost / sumWithoutTax);

    let reconsituedWithoutTax = item.articles
        .map((article, i) => (1 + article.vat) * relatives[i])
        .reduce((a, b) => a + b, 0);

    reconsituedWithoutTax = item.cost / reconsituedWithoutTax;

    const menuPart = relatives.map(percent => percent * reconsituedWithoutTax);

    const VAT = menuPart
        .map((part, i) => part * item.articles[i].vat)
        .reduce((a, b) => a + b, 0);

    return VAT;
};
