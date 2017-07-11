// ==UserScript==
// @name          coinc_amazon_discount_show
// @namespace     danibaena
// @description   Script to add Coinc Discount Price next to the original price
// @include       http://www.amazon.es/*
// @include       https://www.amazon.es/*
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require       https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant         none
// ==/UserScript==

function addCoincPrice() {
    var parser = new DOMParser();
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
        if(previousValue !== null) {
            return (getPrice(previousValue) < getPrice(currentValue)) ? previousValue : currentValue;
        } else {
            return currentValue;
        }
    });

    var res = getPrice(itemPrice);
    var coincPrice = (res/1.04).toFixed(2).toString().replace(".",",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");

    var coincPriceTextSpan = '<span class="a-color-secondary a-size-base a-text-left" style="vertical-align: top; padding: 6px;">Precio Coinc:</span>';
    var coincPriceSpan = '<span class="a-size-medium a-color-price" id="coinc_price">EUR ' + coincPrice + '</span>';

    $(itemPrice).append(coincPriceTextSpan);
    $(itemPrice).append(coincPriceSpan);
}

function getPrice(itemPrice) {
    return parseFloat(itemPrice.innerHTML.replace("EUR", "").trim().replace(".","").replace(",","."));
}

waitForKeyElements ("#priceblock_ourprice", addCoincPrice, false);
waitForKeyElements ("#priceblock_dealprice", addCoincPrice, false);
waitForKeyElements ("#priceblock_saleprice", addCoincPrice, false);