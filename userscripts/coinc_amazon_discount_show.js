// ==UserScript==
// @name          coinc_amazon_discount_show
// @namespace     danibaena
// @description   Script to add Coinc Discount Price next to the original price
// @include       http://www.amazon.es/*
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require       https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant         none
// ==/UserScript==

function addCoincPrice () {

    var priceId = "priceblock_ourprice";
    var priceDealId = "priceblock_dealprice";
    var priceSaleId = "priceblock_saleprice";
  
    if(document.getElementById(priceId)!==null) {
       var itemPrice = document.getElementById(priceId);    
    } else {
        if(document.getElementById(priceDealId)!==null) { 
           var itemPrice = document.getElementById(priceDealId);
        } else {
            var itemPrice = document.getElementById(priceSaleId);
        }
      
    }
    
    var str = itemPrice.innerHTML;

    if( ( str !== "No disponible." ) && ( str.indexOf("-") === -1 ) ){
        var res = str.replace("EUR", "").trim().replace(".","").replace(",",".");
        res = parseFloat(res);  
        coincPrice = (res/1.04).toFixed(2).toString().replace(".",",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");

        var coincPriceTextSpan = document.createElement("span");
        coincPriceTextSpan.setAttribute("class", "a-color-secondary a-size-base a-text-left");
        var text = document.createTextNode("Precio Coinc:")
        coincPriceTextSpan.appendChild(text);
        coincPriceTextSpan.style.verticalAlign = "top";
        coincPriceTextSpan.style.padding = "6px 6px";

        var coincPriceSpan = document.createElement("span");
        coincPriceSpan.setAttribute("class", "a-size-medium a-color-price");
        coincPriceSpan.setAttribute("id", "coinc_price");
        var text2 = document.createTextNode("EUR " + coincPrice);
        coincPriceSpan.appendChild(text2);
        
        itemPrice.appendChild(coincPriceTextSpan);
        itemPrice.appendChild(coincPriceSpan);
    }
}

waitForKeyElements ("#priceblock_ourprice", addCoincPrice, false);
waitForKeyElements ("#priceblock_dealprice", addCoincPrice, false);
waitForKeyElements ("#priceblock_saleprice", addCoincPrice, false);