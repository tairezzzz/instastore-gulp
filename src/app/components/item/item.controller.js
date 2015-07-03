'use strict';

angular.module('instastore')
    .controller('ItemIndex', ['$scope', 'rest', 'toaster', 'UserService', '$stateParams', '$rootScope', '$state', 'feedHelper', 'errorService', '$filter',
        function ($scope, rest, toaster, UserService, $stateParams, $rootScope, $state, feedHelper, errorService, $filter) {
            if (!UserService.isGuest()) {
                var store;
                if (!UserService.isYourStore()) {
                    rest.path = 'v1/stores';
                    rest.models({store_url: $stateParams.storeurl}).success(function (data) {
                        $scope.store = store = data[0];
                        if (!store) {
                            errorService.simpleAlert('nostorewithurl');
                            $state.go('grid');
                            return;
                        }
                        rest.path = 'v1/items';
                        rest.models({user_id: store.user_id, status: 20}).success(function (data) {
                            $scope.items = data;
                        });
                    }).error(errorService.simpleAlert);
                }
                else {
                    rest.path = 'v1/user-items';
                    rest.models().success(function (data) {
                        $scope.items = data;
                    }).error(errorService.simpleAlert);
                }

                $scope.seemore = function (go) {
                    feedHelper.seeMore = true;
                    $state.go('itemview', go);
                };

                $scope.leavecomment = function (go) {
                    feedHelper.leaveComment = true;
                    $state.go('itemview', go);
                };

                $scope.toggleItemStatus = function (item) {
                    if (item.status == 10) item.status = 20;
                    else item.status = 10;
                    rest.putModel(item).success(function (data) {
                        var found = $filter('getById')($scope.items, data.id);
                        found.status = data.status;
                    }).error(errorService.alert);
                };
            }
        }])
    .controller('ItemView', ['$scope', 'rest', 'toaster', '$state', 'feedHelper', 'errorService', 'UserService', '$stateParams', '$location', '$anchorScroll', '$timeout',
        function ($scope, rest, toaster, $state, feedHelper, errorService, UserService, $stateParams, $location, $anchorScroll, $timeout) {

            $scope.item = {};

            if ($stateParams.itemurl) {
                rest.path = 'v1/items';
                rest.models({item_url: $stateParams.itemurl}).success(function (data) {
                    $scope.item = data[0];
                }).error(errorService.alert);
            }
            else {
                errorService.simpleAlert('noitemwithurl');
                $state.go('grid');
            }

            $scope.save = function () {
                $scope.item.item_url = $scope.item.title;
                rest.path = 'v1/user-items';
                rest.putModel($scope.item).success(function (item) {
                    toaster.pop('success', "Saved");
                    $state.transitionTo('itemview', {storeurl: $stateParams.storeurl, itemurl: item.item_url, tab: 4});
                }).error(errorService.alert);
            };

            $scope.removeImage = function (thumb) {

                rest.path = 'v1/item-images/' + thumb.id;

                rest.deleteModel()
                    .success(function () {
                        var index = $scope.item.images.indexOf(thumb);
                        $scope.item.images.splice(index, 1);
                        toaster.pop('success', "Image deleted!");
                    })
                    .error(errorService.alert);
            };

            $scope.removeItem = function () {

                rest.path = 'v1/items/' + $scope.item.id;
                rest.deleteModel()
                    .success(function () {
                        toaster.pop('success', "Item deleted!");
                        $state.go('grid');
                    })
                    .error(errorService.alert);
            };

            $scope.saveComment = function (comment) {
                rest.path = 'v1/comments';
                $scope.seeMore = true;
                rest.postModel({content: comment, item_id: $scope.item.id}).success(function () {
                    toaster.pop('success', "Commented");
                    $scope.item.comments.push({authorFullName: UserService.getUserFullName(), content: comment});
                    $scope.item.newComment = null;
                }).error(errorService.alert);
            };

            $scope.seeMore = false;
            if (feedHelper.seeMore) {
                $scope.seeMore = true;
                feedHelper.seeMore = false;
            }

            $scope.leaveComment = false;
            if (feedHelper.leaveComment) {
                $scope.leaveComment = true;
                feedHelper.leaveComment = false;
            }

            $scope.showCommentTabGoToBottom = function () {
                $scope.leaveComment = !$scope.leaveComment;
                $timeout(function () {
                    $location.hash('bottom');
                    $anchorScroll();
                }, 100);
            };
        }
    ])
    .
    controller('ItemAdd', ['$scope', 'rest', 'toaster', '$upload', 'API_URL', 'ngDialog', 'errorService',
        function ($scope, rest, toaster, $upload, API_URL, ngDialog, errorService) {

            rest.path = 'v1/items';

            $scope.item = {brand_id: 9, category_id: 1, description: ''};

            $scope.$watch('image2', function () {
                if ($scope.image2) $scope.single($scope.image2);
            });

            $scope.save = function () {
                $scope.item.item_url = $scope.item.title;
                rest.path = 'v1/items';
                if ($scope.item.id) {
                    rest.putModel($scope.item).success(function () {
                        toaster.pop('success', "Saved");
                    }).error(errorService.alert);
                }
                else {
                    rest.postModel($scope.item).success(function () {
                        toaster.pop('success', "Saved");
                    }).error(errorService.alert);
                }
                ngDialog.close();
            };


            var dataURItoBlob = function (dataURI) {
                var binary = atob(dataURI.split(',')[1]);
                var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
                var array = [];
                for (var i = 0; i < binary.length; i++) {
                    array.push(binary.charCodeAt(i));
                }
                return new Blob([new Uint8Array(array)], {type: mimeString});
            };

            $scope.single = function (image) {
                if ($scope.item.id) {
                    $scope.upload([dataURItoBlob(image.dataURL)]);
                }
                else {
                    rest.path = 'v1/items';
                    rest.postModel($scope.item).success(function (item) {
                        $scope.item.id = item.id;
                        $scope.upload([dataURItoBlob(image.dataURL)]);
                    }).error(errorService.alert);
                }

            };

            $scope.upload = function (files) {
                if (files && files.length) {
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        $upload.upload({
                            url: API_URL + 'v1/item/upload',
                            fields: {
                                'itemId': $scope.item.id
                            },
                            headers: {
                                'Content-Type': file.type
                            },
                            method: 'POST',
                            data: file,
                            file: file
                        }).progress(function (evt) {
                            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                            console.log('File upload: ' + progressPercentage + '% ');
                        }).success(function (data, status, headers, config) {
                            if (data.image_url) {
                                toaster.pop('success', 'File uploaded!');
                            }
                            else errorService.simpleAlert('fileisntuploaded');
                        });
                    }
                }
            };
        }
    ])
    .controller('ItemViewTabsCtrl', ['$scope', '$rootScope', '$timeout', '$stateParams', 'UserService', function ($scope, $rootScope, $timeout, $stateParams, UserService) {

        $scope.onClickTab = function (tab) {
            $scope.currentTab = tab.url;
        }

        $scope.isActiveTab = function (tabUrl) {
            UserService.init();
            return tabUrl == $scope.currentTab;
        }

        $scope.likeItem = function () {
            $rootScope.showHearts = true;
            $timeout(function () {
                $rootScope.showHearts = false;
            }, 1000);
        };

        if ($rootScope.isSeller)
            switch ($stateParams.tab) {
                case '1':
                    $scope.currentTab = 'app/components/item/view-tab-comment.html';
                    break;
                case '2':
                    $scope.currentTab = 'app/components/item/view-tab-log.html'
                    break;
                case '3':
                    $scope.currentTab = 'app/components/item/view-tab-social.html'
                    break;
                case '4':
                    $scope.currentTab = 'app/components/item/view-tab-edit.html'
                    break;
                default:
                    $scope.currentTab = 'app/components/item/view-tab-comment.html';
            }
        else
            switch ($stateParams.tab) {
                case '1':
                    $scope.currentTab = 'app/components/item/view-tab-comment.html';
                    break;
                case '2':
                    $scope.currentTab = 'app/components/item/view-tab-buy.html';
                    break;
                case '3':
                    $scope.currentTab = 'app/components/item/view-tab-comment.html';
                    $scope.likeItem();
                    break;
                case '4':
                    $scope.currentTab = 'app/components/item/view-tab-location.html'
                    break;
                default:
                    $scope.currentTab = 'app/components/item/view-tab-comment.html';
            }
    }])
    .controller('ShrinkUploadImageCtrl', ['$scope', '$stateParams', '$upload', 'API_URL', 'toaster', 'ImageService', 'cfpLoadingBar',
        function ($scope, $stateParams, $upload, API_URL, toaster, ImageService, cfpLoadingBar) {

            $scope.$watch('image2', function (val) {
                if (val) {
                    if (val.length > 0) {
                        $scope.upload(val, $scope.item.id);
                        delete $scope.image2;
                    }
                }
            });

            $scope.upload = function (files, id) {
                if (files && files.length) {
                    for (var i = 0; i < files.length; i++) {
                        var file = ImageService.dataURItoBlob(files[i].resized.dataURL);
                        $upload.upload({
                            url: API_URL + 'v1/item/upload',
                            fields: {
                                'itemId': id,
                                'orientation': files[i].orientation
                            },
                            headers: {
                                'Content-Type': file.type
                            },
                            method: 'POST',
                            data: file,
                            file: file
                        }).progress(function (evt) {
                            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                            console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                            cfpLoadingBar.status() // Returns the loading bar's progress.
                        }).success(function (data) {
                            toaster.pop('success', 'File uploaded!');
                            delete $scope.image2;
                            $scope.item.images.push({'image_url': data.image_url});
                            console.log('file ' + data.image_url + ' uploaded!');
                        });
                    }
                }
            };
        }])
    .controller('ItemLocation', ['$scope', '$rootScope', 'uiGmapGoogleMapApi', function ($scope, $rootScope, uiGmapGoogleMapApi) {
        uiGmapGoogleMapApi.then(function (maps) {
            if ($rootScope.store) {
                $scope.map = {
                    center: {latitude: $rootScope.store.store_long, longitude: $rootScope.store.store_lat},
                    zoom: 14
                };
                $scope.staticMarker = {id: 'store-marker'};
                $scope.staticMarker.coords = {
                    latitude: $rootScope.store.store_long,
                    longitude: $rootScope.store.store_lat
                };
            }
        });
    }]);
