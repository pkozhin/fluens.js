/**
 * @role {QCommand}
 * @owner mainCommands
 * @type {*[]}
 */
command.GetUserCommand = [
    "service.MainService",
    "model.LoginModel",
    "model.MainModel",
    function(mainService, loginModel, mainModel) {

        var _userId = null;

        this.initialize = function(userId) {
            if (!(userId)) {
                throw new Error("Parameters malformed.");
            }
            _userId = userId;
            this.initialized = true;
        };

        this.promise = function() {
            loginModel.processing = true;
            return mainService.getUser(_userId)
                .then(function(user) {
                    mainModel.user = user;
                })['finally'](function() {
                loginModel.processing = false;
            });
        };
    }
];
