module.exports = function (grunt) {

    var config;

    grunt.initConfig(config = {
        releaseDir: "tasks",
        pkg: grunt.file.readJSON("package.json"),
        license: "License: <%= grunt.config.get('pkg.license.type') %>, <%= grunt.config.get('pkg.license.url') %>",
        copyright: "<%= grunt.config.get('pkg.copyright') %>",
        version: "<%= grunt.config.get('pkg.version') %>",
        src: {
            sources: ["src/**/*.js"],
            prefix: ["src/fluent.prefix"],
            suffix: ["src/fluent.suffix"]
        },
        fluent: {
            name: "<%= grunt.config.get('pkg.title') %>",
            fileName: "fluent",
            file: "<%= releaseDir %>/<%= fluent.fileName %>.js",
            fileMin: "<%= releaseDir %>/<%= fluent.fileName %>.min.js",
            banner:
                "/**\n" +
                "* <%= fluent.name %> - v<%= version %>\n" +
                "* <%= copyright %>\n" +
                "* <%= license %>\n" +
                "*/\n"
        },
        bumpup: {
            options: {
                updateProps: {
                    pkg: 'package.json'
                }
            },
            file: 'package.json'
        },
        clean: {
            fluent: ["<%= fluent.file %>", "<%= fluent.fileMin %>"]
        },
        concat: {
            options: {
                process: true
            },
            fluent: {
                src: ["<%= src.prefix %>", "<%= src.sources %>", "<%= src.suffix %>"],
                dest: "<%= fluent.file %>",
                options: {
                    banner: "<%= fluent.banner %>"
                }
            }
        },
        jshint: {
            fluent: ["<%= fluent.file %>"],
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                node: true,
                es5: true}
        },
        nodeunit: {
            tests: ['test/*.test.js']
        }
    });

    require('time-grunt')(grunt);

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-bumpup');
    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    grunt.registerTask("release-bump", function(type) {
        grunt.task.run("bumpup:" + (type ? type : "patch"));
        grunt.task.run("release");
    });

    grunt.registerTask("release", ["clean:fluent", "concat:fluent", "jshint:fluent"]);
};