/**
 * @id mainCommands
 * @module main
 * @dependency {Service}
 * @role {CommandLocator}
 * @type {*[]}
 */
command.CommandLocator = ["Ether", function(Ether) {

    /*<fluens:commands>*/
    this.getGetUserCommand = function(userId) {
    	return Ether.plugin.commands.q().get(command.GetUserCommand, userId);
    };
    
    this.getLoginCommand = function(username, password) {
    	return Ether.plugin.commands.q().get(command.LoginCommand, username, password);
    };
    
    this.getStartupCommand = function() {
    	return Ether.plugin.commands.plain().get(command.StartupCommand);
    };
    /*</fluens:commands>*/

}];
