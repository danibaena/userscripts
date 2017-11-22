// ==UserScript==
// @name          amazon_wishlist_sum
// @namespace     danibaena
// @description   Just a simple script to sum all items and prices in an Amazon.es' Wishlist url
// @include       http://www.amazon.es/gp/registry/wishlist/*
// @include       https://www.amazon.es/gp/registry/wishlist/*
// @include       https://www.amazon.es/hz/wishlist/ls/*
// @include       http://www.amazon.es/hz/wishlist/ls/*
// @require       https://code.jquery.com/jquery-3.2.1.slim.min.js
// @require       https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant         none
// ==/UserScript==

function addItemPricesSum() {
    var itemsList               = $(".g-item-sortable[data-id]").length ? $(".g-item-sortable[data-id]") : $(".awl-item-wrapper[data-price]") ;
    var priceClass              = "a-price-whole";
    var paginationID            = "wishlistPagination";
    var pages                   = document.getElementById(paginationID);
    var page                    = pages ? "Datos para esta página de la lista:<br>" : "Datos de la lista:<br>";
    var itemSum                 = 0;
    var itemCounter             = 0;
    var itemNotAvailableCounter = 0;

    itemsList.each(function(index , item) {
        var result = $(item).attr('data-price');
        result     = result !== '-Infinity' ? parseFloat(result) : result;
        if(result === '-Infinity') {
            itemNotAvailableCounter++;
        } else {
            itemSum += result;
            itemCounter++;
        }
    });

    itemSum      = itemSum.toFixed(2);
    itemSumCoinc = (itemSum/1.04).toFixed(2);
    itemSumCoinc = itemSumCoinc.toString().replace(".",",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    itemSum      = itemSum.toString().replace(".",",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");

    var textList = `
        <p>${page}</p>
        <div class="row">
            <span>Artículos totales:</span>
            <span class="right">${itemCounter}</span>
        </div>
        <div class="row">
            <span>Artículos no disponibles:</span>
            <span class="right">${itemNotAvailableCounter}</span>
        </div>
        <div class="row">
            <span>Coste total:</span>
            <span class="right">${itemSum} €</span>
        </div>
        <div class="row">
            <span>Coste total con COINC:</span>
            <span class="right">${itemSumCoinc} €</span>
        </div>
    `;

    var ruleDivider = '<hr class="a-divider-normal awl-divider" id="scriptlist-divider">';
    ruleDivider     = isMobile() ? ruleDivider : '';

    var scriptList = `
        ${ruleDivider}
        <div class="a-price ${priceClass}" data-a-size="m" data-a-color="base" id="scriptlist">
            ${textList}
        </div>
    `;

    var $scriptList = $('#scriptlist');

    if($scriptList.length) {
        $scriptList.replaceWith(scriptList);
    } else {
        $(scriptList).insertAfter('#endOfListMarker');
    }
}


var isMobile = function() {
    return /Mobi/i.test(navigator.userAgent) || /Android/i.test(navigator.userAgent);
};

var scriptListStyles = `
    <style>
        #scriptlist {
            line-height: 1;
            font-size: 12px;
            font-weight: 400;
            z-index: 2;
            position: relative;
            display: block;
            max-width: 292px;
            margin: 0 auto;
            background-color: #fff;
            padding-top: 15px;
            ${isMobile() ? 'padding-left: 15px;' : ''}
        }

        #scriptlist p {
            font-weight: 600;
        }
        #scriptlist .row {
            display: flex;
            justify-content: space-between;
            padding-bottom: 5px;
        }
        #scriptlist .row .right {
            font-weight: 600;
        }

        #scriptlist-divider {
            margin-top: 15px;
        }
    </style>
`;

$(scriptListStyles).appendTo('head');

var elementToWait = $(".g-item-sortable[data-id]").length ? ".g-item-sortable[data-id]" : ".awl-item-wrapper[data-price]";
waitForKeyElements (elementToWait, addItemPricesSum, false);
