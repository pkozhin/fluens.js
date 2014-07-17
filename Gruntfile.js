module.exports = function (grunt) {

    require('time-grunt')(grunt);

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-bumpup');
    grunt.loadNpmTasks("grunt-karma");

    var config;

    grunt.initConfig(config = {
        releaseDir: "dist",
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
            fluent: ["<%= fluent.file %>"]
        }
    });

    grunt.registerTask("release-bump", function(type) {
        grunt.task.run("bumpup:" + (type ? type : "patch"));
        grunt.task.run("release");
    });

    grunt.registerTask("release", ["clean:fluent", "concat:fluent", "jshint:fluent"]);
};