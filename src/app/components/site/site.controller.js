'use strict';

angular.module('instastore')
    .controller('MyCtrl', function ($scope, $document) {

    })
    .controller('SiteLogin', ['$scope', '$rootScope', 'rest', '$state',
      '$auth', 'UserService', 'SStorage', 'InAppService', '$mdSidenav', '$document', 'messageService', 'TourService', '$cookies',
      function ($scope, $rootScope, rest, $state,
                $auth, UserService, SStorage, InAppService, $mdSidenav, $document, messageService, TourService, $cookies) {

        InAppService.warnIfInApp();
        $scope.isInApp = InAppService.isFacebookInApp();

        var profile = UserService.getProfile();
        $scope.store = profile.store;

        if (!UserService.isGuest()) {
          if (UserService.isSeller()) {
            if (!UserService.goToLastRouteFromProfile()) {
              UserService.goToMainStore();
            }
          } else {
            UserService.goToStream();
          }
        }

        $scope.selected = function () {
          sideNavClose();
        };

        $scope.toggleRight = buildToggler('right');
        $scope.isOpenRight = function () {
          return $mdSidenav('right').isOpen();
        };

        function sideNavClose() {
          var sidenav = $mdSidenav('right');

          if (sidenav.isOpen()) {
            sidenav.close();
          }
        }

        function buildToggler(navID) {
          return function () {
            $mdSidenav(navID)
                .toggle()
                .then(function () {
                });
          }
        }

        $scope.toTheTop = function () {
          $document.scrollTopAnimated(0, 2000).then(function () {
          });
        };

        $scope.isSession = SStorage.isSessionStorageAvailable();

        $scope.authenticate = function (provider) {
          sideNavClose();
          $auth.authenticate(provider).then(function (res) {
            UserService.login(res.data.token)
                .then(function () {
                  UserService.setFacebookProfile(res.data.facebookProfile);
                  res.data.profile.stores = res.data.stores;
                  if (res.data.store) {
                    TourService.init();
                    res.data.profile.store = res.data.store;
                    UserService.setBg(res.data.store.bg_url);
                    UserService.setAvatar(res.data.store.avatar_url);
                  }
                  else {
                    res.data.profile.store = {};
                  }
                  UserService.setProfile(res.data.profile);
                  UserService.setIsSeller(res.data.profile.seller);
                  if (UserService.getInvitedStatus()) {
                    res.data.profile.seller ? UserService.goToMainStore() : $state.go('stream', {storeurl: res.data.store.store_url});
                  }
                  else {
                    $state.go('storeselect');
                  }
                });
          }, messageService.satellizerAlert);
        };

      }])
    .controller('SellOrBuy', ['$scope', 'UserService', '$state', function ($scope, UserService, $state) {

      $scope.facebookProfile = UserService.getFacebookProfile();

      var profile = UserService.getProfile();
      $scope.sellerAllowed = profile.seller;

      $scope.goAsBuyer = function () {
        UserService.setIsSeller(false);
        $state.go('grid', {
          storeurl: profile.seller ? profile.store.store_url : profile.inviter_url,
          mode: 'feed'
        });
      };

      $scope.goAsSeller = function () {
        UserService.setIsSeller(true);
        $state.go('grid', {storeurl: profile.store.store_url});
      };
    }])
    .controller('SiteStoreSelect', ['$scope', 'UserService', '$state', 'rest', 'messageService',
      function ($scope, UserService, $state, rest, messageService) {
        $scope.profile = UserService.getProfile();
        $scope.selectStore = function (inviter_id) {
          $scope.profile.inviter_id = inviter_id;
          rest.path = 'v1/profiles';
          rest.putModel($scope.profile).success(function (profile) {
            UserService.setProfile(profile);
            messageService.simpleByCode('store', 'saved');
            $state.go('sellorbuy');
          }).error(messageService.alert);
        };
      }]);