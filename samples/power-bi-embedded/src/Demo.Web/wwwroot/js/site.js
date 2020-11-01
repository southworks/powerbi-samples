// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Navigation sidebar
$(document).ready(function () {
    $('.dropdown-menu a.dropdown-toggle').on('click', function (e) {
        if (!$(this).next().hasClass('show')) {
            $(this).parents('.dropdown-menu').first().find('.show').removeClass('show');
        }
        var $subMenu = $(this).next('.dropdown-menu');
        $subMenu.toggleClass('show');


        $(this).parents('li.nav-item.dropdown.show').on('hidden.bs.dropdown', function (e) {
            $('.dropdown-submenu .show').removeClass('show');
        });

        return false;
    });

    $('li.preserve-filters-option a').on('click', function (e) {
        var elem = $(this).find("input").get(0);
        var preserve = elem.value == "true";
        $(`#preserve-filters-${preserve}`).prop("checked", true);
        preserveFilters(preserve);
        e.stopPropagation();
    });
});