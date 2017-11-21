// ==UserScript==
// @name          coinc_amazon_discount_show
// @namespace     danibaena
// @description   Script to add Coinc Discount Price next to the original price
// @include       http://www.amazon.es/*
// @include       https://www.amazon.es/*
// @require       https://code.jquery.com/jquery-3.2.1.slim.min.js
// @require       https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant         none
// ==/UserScript==

function addCoincPrice() {
    var itemPriceIds = [
        "priceblock_ourprice",
        "priceblock_dealprice",
        "priceblock_saleprice",
    ];

    var itemPrice = itemPriceIds.map(function(currentValue, index) {
        return document.getElementById(currentValue);
    }).filter(function(item) {
        return ((item !== null) && (item.innerHTML !== "No disponible.") && (item.innerHTML.indexOf("-") === -1));
    }).reduce(function(previousValue, currentValue) {
        if(!previousValue) {
            return currentValue;
        }
        return (getPrice(previousValue) < getPrice(currentValue)) ? previousValue : currentValue;
    });

    var res               = getPrice(itemPrice);
    var coincPrice        = (res/1.04).toFixed(2).toString().replace(".",",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    var coincPriceMessage = `
        <tr id="coincMessage">
            <td id="priceblock_coincprice_lbl" class="a-color-secondary a-size-base a-text-right a-nowrap">Coinc:</td>
            <td><span class="a-size-medium a-color-price" id="coinc_price">EUR ${coincPrice}</span></td>
        </tr>
    `;

    $(coincPriceMessage).insertBefore('#vatMessage');
}

function getPrice(itemPrice) {
    return parseFloat(itemPrice.innerHTML.replace("EUR", "").trim().replace(".","").replace(",","."));
}

waitForKeyElements ("#priceblock_ourprice", addCoincPrice, false);
waitForKeyElements ("#priceblock_dealprice", addCoincPrice, false);
waitForKeyElements ("#priceblock_saleprice", addCoincPrice, false);