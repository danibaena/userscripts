// ==UserScript==
// @name          amazon_wishlist_sum
// @namespace     danibaena
// @description   Just a simple script to sum all items and prices in an Amazon.es' Wishlist url
// @include       http://www.amazon.es/gp/registry/wishlist/*
// @include       https://www.amazon.es/gp/registry/wishlist/*
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @grant         none
// ==/UserScript==

var divId = "g-items-btf";
var productsList = document.getElementById(divId);
var priceClass = "a-size-base a-color-price a-text-bold";
var itemPrices = document.getElementsByClassName(priceClass);
var itemSum = 0;
var itemCounter = 0;
var itemNotAvailableCounter = 0;

for (i=0; i<itemPrices.length; i++){
	var str = itemPrices[i].innerHTML.trim();
	if((str !== 'No disponible') && ( str !== '') ){
			var res = str.replace("EUR", "");
			res = res.trim();
			res = res.replace(".","");
			res = res.replace(",",".");
			res = parseFloat(res);
			itemSum+=res;
			itemCounter++;
		} else {
			itemNotAvailableCounter++;
		}
}
itemSum = itemSum.toFixed(2);
itemSumCoinc = (itemSum/1.04).toFixed(2);
itemSumCoinc = itemSumCoinc.toString().replace(".",",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
itemSum = itemSum.toString().replace(".",",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");

var scriptList = document.createElement("div");
scriptList.setAttribute("class", priceClass);
scriptList.setAttribute("id", "scriptList");
productsList.appendChild(scriptList);

var list = document.getElementById("scriptList");
list.style.display = 'flex';
list.style.justifyContent = 'center';
list.style.borderTop = '1px solid #DDD';
list.style.paddingTop = '22px';
list.style.textAlign = 'center';

var paginationID = "wishlistPagination";
var pages = document.getElementById(paginationID);
var page;


if(pages !== null){
    page = "Datos para esta página de la lista:<br>";
} else {
    page = "Datos de la lista:<br>";
}
list.innerHTML = page +
         "Artículos totales: "        + itemCounter             + "<br>" +
         "Artículos no disponibles: " + itemNotAvailableCounter + "<br>" +
         "Coste total: "              + itemSum                 + " EUR<br>" +
         "Coste total con COINC: "    + itemSumCoinc            + " EUR";