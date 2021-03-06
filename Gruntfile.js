/*
 * fluens
 * https://github.com/pkozhin/fluens.js
 *
 * Copyright (c) 2014 Pavel Kozhin
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
    // load all npm grunt tasks
    require("load-grunt-tasks")(grunt);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        license: "License: <%= grunt.config.get('pkg.license.type') %>, <%= grunt.config.get('pkg.license.url') %>",
        copyright: "<%= grunt.config.get('pkg.copyright') %>",
        version: "<%= grunt.config.get('pkg.version') %>",
        src: {
            sources: ["src/**/*.js"],
            prefix: ["src/fluens.prefix"],
            suffix: ["src/fluens.suffix"]
        },
        config: {
            releaseDir: "tasks",
            name: "<%= grunt.config.get('pkg.title') %>",
            fileName: "fluens",
            file: "<%= config.releaseDir %>/<%= config.fileName %>.js",
            banner:
                "/**\n" +
                "* <%= config.name %> - v<%= version %>\n" +
                "* <%= copyright %>\n" +
                "* <%= license %>\n" +
                "*/\n"
        },

        clean: {
            tests: ["tmp"],
            fluens: ["<%= config.releaseDir %>/*.js"]
        },

        concat: {
            options: {
                process: true
            },
            fluens: {
                src: ["<%= src.prefix %>", "<%= src.sources %>", "<%= src.suffix %>"],
                dest: "<%= config.file %>",
                options: {
                    banner: "<%= config.banner %>"
                }
            }
        },

        bumpup: {
            options: {
                updateProps: {
                    pkg: "package.json"
                }
            },
            file: "package.json"
        },

        jshint: {
            fluens: ["<%= config.file %>"],
            options: {
                jshintrc: ".jshintrc",
                reporter: require("jshint-stylish")
            }
        },

        // Configuration to be run (and then tested).
        fluens: {
            test: {
                options: {
                    expose: {
                        someOption: "foo",
                        someOption2: "foo2"
                    },
                    cwd: "./test/src/example/src",
                    phase: {

                    }
                },
                sources: {
                    parse: {
                        paths: ["fred/*.js", "model/*.js", "*.js"]
                    },
                    inject: {
                        cwd: "./test/src/example/src",
                        paths: ["*.html", "model/*.js"]
                    }
                },
                dependencies: {
                    stub: {
                        cwd: "./test/src/example/src/deps",
                        paths: ["**/stub/*.js"],
                        rules: {
                            "hello/MyController": "hello/stub/MyController"
                        }
                    },
                    parse: {
                        cwd: "./test/src/example/src/deps",
                        paths: ["hello/*.js", "hello/**/*.js"]
                    },
                    inject: {
                        paths: ["*.js"]
                    }
                },
                styles: {
                    parse: {
                        cwd: "./test/src/example/src",
                        paths: ["styles/*.css"]
                    },
                    inject: {
                        paths: ["*.html"]
                    }
                },
                namespaces: {
                    parse: {
                        filter: "isDirectory",
                        paths: ["deps/**", "fred/**"]
                    },
                    inject: {
                        paths: ["*.js"],
                        /* Notifies injector to inject it with default logic (just for example here) */
                        action: "default"
                    }
                },
                vendors: {
                    parse: {
                        cwd: "./test/src/example/vendor",
                        paths: ["*.js"]
                    },
                    inject: {
                        paths: ["*.html"]
                    }
                },
                commands: {
                    parse: {
                        paths: ["command/*.js"]
                    },
                    inject: {
                        paths: ["command/*.js"]
                    }
                }
            }
        },

        // Unit tests.
        nodeunit: {
            tests: ["test/*.test.js"]
        }

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks("tasks");

    require("time-grunt")(grunt);

    grunt.registerTask("release-bump", function(type) {
        grunt.task.run("bumpup:" + (type ? type : "patch"));
        grunt.task.run("release");
    });

    grunt.registerTask("test", ["jshint", "fluens", "nodeunit"]);

    // By default, lint and run all tests.
    grunt.registerTask("default", ["clean", "concat", "jshint", "release-bump", "test"]);
    grunt.registerTask("release", ["clean", "concat", "jshint"]);

};
