/**
 * @id mainCommands
 * @module main
 * @dependency {Service}
 * @role {CommandLocator}
 * @type {*[]}
 */
command.CommandLocator = ["ether", function(ether) {

    /*<fluens:commands>*/
    this.getGetUserCommand = function(userId) {
        return ether.plugin.commands.q().get(command.GetUserCommand, userId);
    };

    this.getLoginCommand = function(username, password) {
        return ether.plugin.commands.q().get(command.LoginCommand, username, password);
    };

    this.getStartupCommand = function() {
        return ether.plugin.commands.plain().get(command.StartupCommand);
    };
    /*</fluens:commands>*/

}];
