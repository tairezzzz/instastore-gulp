(function () {
  'use strict';

  angular
      .module('instastore')
      .service('ModalService', ModalService);

  ModalService.$inject = ['$mdDialog', '$mdMedia', '$q'];

  /* @ngInject */
  function ModalService($mdDialog, $mdMedia, $q) {
    this.show = show;

    ////////////////

    function show(templateName, locals, controller) {
      var controller = controller || 'DialogController as vm';
      var deferred = $q.defer();
      $mdDialog.show({
        controller: controller,
        templateUrl: 'app/components/modal/templates/' + templateName + '.html',
        parent: angular.element(document.body),
        clickOutsideToClose: true,
        bindToController: true,
        locals: locals,
        fullscreen: $mdMedia('xs'),
        onRemoving: function () {
          deferred.resolve();
        }
      });

      return deferred.promise;
    }
  }

})();

