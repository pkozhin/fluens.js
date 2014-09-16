/**
 * @role {QCommand}
 * @owner mainCommands
 * @type {*[]}
 */
command.LoginCommand = [
    "service.MainService",
    "model.LoginModel",
    "model.MainModel",
    function(mainService, loginModel, mainModel) {

        var _username = null;
        var _password = null;

        this.initialize = function(username, password) {
            if (!(username && password)) {
                throw new Error("Parameters malformed.");
            }
            _username = username;
            _password = password;

            this.initialized = true;
        };

        this.promise = function() {
            loginModel.processing = true;
            return mainService.login(_username, _password)
                .then(function(user) {
                    mainModel.user = user;
                }, function(error) {
                    loginModel.loginError = error;
                })['finally'](function(){
                loginModel.processing = false;
            });
        };
    }
];
