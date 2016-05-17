(function () {
  'use strict';
  angular.module('angularHideHeader', []).directive('hideHeader', ['$timeout', '$window', '$rootScope', function ($timeout, $window, $rootScope) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var scrollposition = 0;
        var hideOffset = attrs.hideOffset;
        angular.element($window).bind("scroll", function () {
          var body = angular.element(document.getElementsByTagName('body'));
          var current_scroll = body[0].scrollTop;
          var hheight = element[0].scrollHeight;
          var pxOffset = parseInt(hideOffset);
          if (current_scroll >= hheight + pxOffset) {
            if (current_scroll <= scrollposition) {
              element.removeClass('hideh');
              if($rootScope.isHomeScreen) {
                element.css({'top': "20px"});
              } else {
                element.css({'top': "0px"});
              }
            }
            else {
              element.addClass('hideh');
              element.css({
                'top': -hheight + "px",
                'transition': 'top 0.25s',
                '-webkit-transition': 'top 0.25s',
                '-moz-transition': 'top 0.25s',
                '-ms-transition': 'top 0.25s',
                '-o-transition': 'top 0.25s'
              });
            }
          }
          else if (current_scroll >= hheight || current_scroll == 0) {
            element.removeClass('hideh');
            element.css({
              'top': "0px"
            });
          }
          scrollposition = body[0].scrollTop;
        });
      }
    }
  }]);
}());