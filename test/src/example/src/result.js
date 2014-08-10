    /*<fluens:dependencies>*/
    main.controller("MyController", hello.stub.MyController);
    main.service("hello.MyService", hello.MyService);
    /*</fluens:dependencies>*/

    /*<fluens:namespaces>*/
    window.deps = {};
    window.deps.hello = {};
    window.deps.hello.stub = {};
    window.fred = {};
    /*</fluens:namespaces>*/