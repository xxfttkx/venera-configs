/** @type {import('./_venera_.js')} */

/**
 * @typedef {Object} PageJumpTarget
 * @Property {string} page - The page name (search, category)
 * @Property {Object} attributes - The attributes of the page
 *
 * @example
 * {
 *     page: "search",
 *     attributes: {
 *         keyword: "example",
 *     },
 * }
 */

class Rawkuro extends ComicSource {
    // Note: The fields which are marked as [Optional] should be removed if not used

    // name of the source
    name = "rawkuro"

    // unique id of the source
    key = "rawkuro"

    version = "1.0.0"

    minAppVersion = "1.4.0"

    // update url
    url = ""

    static source_url = "https://rawkuro.net/"

    static headers = {
        "Referer": Rawkuro.source_url,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    static labels = ["etchi","ecchi","komedi"]
    
    static categories = Rawkuro.labels.map(label => ({
        label,
        /**
         * @type {PageJumpTarget}
         */
        target: {
            page: "category",
            attributes: {
            category: label,
            param: null,
            },
        },
    }));

    // explore page list
    explore = [{
        // title of the page.
        // title is used to identify the page, it should be unique
        title: "rawkuro",

        /// multiPartPage or multiPageComicList or mixed
        type: "multiPartPage",

        /**
         * load function
         * @param page {number | null} - page number, null for `singlePageWithMultiPart` type
         * @returns {{}}
         * - for `multiPartPage` type, return [{title: string, comics: Comic[], viewMore: PageJumpTarget}]
         * - for `multiPageComicList` type, for each page(1-based), return {comics: Comic[], maxPage: number}
         * - for `mixed` type, use param `page` as index. for each index(0-based), return {data: [], maxPage: number?}, data is an array contains Comic[] or {title: string, comics: Comic[], viewMore: string?}
         */
        load: async(page) => {
            let res = await Network.get(`${Rawkuro.source_url}all-manga/`);
            throw `要我说explore就别写了，直接被category完爆了，我是一般不会点进来这里，点进来了也是想我怎么点错了`
            if (res.status !== 200) {
                throw `Invalid status code: ${res.status}`
            }

            // 2. 解析文档
            let doc = new HtmlDocument(res.body);
            // 3. 通用解析单元函数
            function parseItem(el) {
                let manga = el.querySelector("a.manga-poster");
                let href = manga.attributes.href;
                let id = href.split("/read/")[1];
                let title = id.split("-raw")[0];
                let img = manga.querySelector("img")
                let cover = img.attributes["data-src"] || img.attributes.src;
                return new Comic({ id, title, cover });
            }

            // 5. 抓「最近更新」
            let latest = [];
            // 找到标题元素，再拿其后面的 <ul> 下的 .media-cell.vertical
            let latest_updated = doc.getElementById("latest-latest-updated");
            if (latest_updated) {
                let ul = latest_updated.querySelector(".mls-wrap");
                if (ul) {
                    let items = ul.querySelectorAll(".item.item-spc.flw-item");
                    for (let el of items) latest.push(parseItem(el));
                }
            }
            // 7. 清理并返回
            doc.dispose();
            let comics = {}
            comics["hot"] = []
            comics["latest"] = latest
            return [
                {
                    title: "最新の更新",
                    comics: latest,
                    viewMore: "もっと",
                }
            ];
        },

        /**
         * Only use for `multiPageComicList` type.
         * `loadNext` would be ignored if `load` function is implemented.
         * @param next {string | null} - next page token, null if first page
         * @returns {Promise<{comics: Comic[], next: string?}>} - next is null if no next page.
         */
        loadNext(next) {},
    }]

    // categories
    category = {
        /// title of the category page, used to identify the page, it should be unique
        title: "rawkuro",
        parts: [{
            // title of the part
            name: "Label",

            // fixed or random or dynamic
            // if random, need to provide `randomNumber` field, which indicates the number of comics to display at the same time
            // if dynamic, need to provide `loader` field, which indicates the function to load comics
            type: "fixed",

            // Remove this if type is dynamic
            categories: Rawkuro.categories,

            // number of comics to display at the same time
            // randomNumber: 5,

            // load function for dynamic type
            // loader: async () => {
            //     return [
            //          // ...
            //     ]
            // }
        },
        {
            // title of the part
            name: "Others",

            // fixed or random or dynamic
            // if random, need to provide `randomNumber` field, which indicates the number of comics to display at the same time
            // if dynamic, need to provide `loader` field, which indicates the function to load comics
            type: "fixed",

            // Remove this if type is dynamic
            categories: [{
                label:"最も見られました",
                /**
                 * @type {PageJumpTarget}
                 */
                target: {
                    page: "category",
                    attributes: {
                    category: "最も見られました",
                    param: "most-viewed",
                    },
                },
            },
            {
                label:"最新の更新",
                /**
                 * @type {PageJumpTarget}
                 */
                target: {
                    page: "category",
                    attributes: {
                    category: "最新の更新",
                    param: "latest-updated",
                    },
                },
            }],

            // number of comics to display at the same time
            // randomNumber: 5,

            // load function for dynamic type
            // loader: async () => {
            //     return [
            //          // ...
            //     ]
            // }
        }],
        // enable ranking page
        enableRankingPage: false,
    }

    /// category comic loading related
    categoryComics = {
        /**
         * load comics of a category
         * @param category {string} - category name
         * @param param {string?} - category param
         * @param options {string[]} - options from optionList
         * @param page {number} - page number
         * @returns {Promise<{comics: Comic[], maxPage: number}>}
         */
        load: async(category, param, options, page) => {
            let url = `${Rawkuro.source_url}genres/${category}/${page}/?sort=last_update&status=0`
            
            if (param === "most-viewed") {
                url = `${Rawkuro.source_url}https://rawkuro.net/ranking/day/${page}`
            }
            if (param === "latest-updated") {
                url = `${Rawkuro.source_url}all-manga/${page}/?sort=last_update&status=0`
            }
            let res = await Network.get(url);   

            if (res.status !== 200) {
                throw `Invalid status code: ${res.status}`
            }

            // 2. 解析文档
            let doc = new HtmlDocument(res.body);
            // 3. 通用解析单元函数
            function parseDoc(doc) {
                let mangaListWrap = doc.querySelector(".grid.gtc-f141a.gg-20.p-13.mh-77vh");
                let mangaList = mangaListWrap.querySelectorAll(".b-img.full-i.i-mage.oh.relative");
                let commics = []
                for (let el of mangaList) {
                    let mangaPoster = el.querySelector("a.block.pt-140p");
                    let href = mangaPoster.attributes.href;
                    let id = href;
                    let title = mangaPoster.attributes.title;
                    let img = mangaPoster.querySelector("img")
                    let cover = img.attributes["data-src"] || img.attributes.src;
                    cover = `${Rawkuro.source_url}` + cover
                    commics.push(new Comic({ id, title, cover }) );
                }
                return commics;
            }

            let comics = parseDoc(doc);
            // 7. 清理并返回
            doc.dispose();
            
            return {
                comics: comics,
                maxPage: 30
            };
        },
        // [Optional] provide options for category comic loading
        optionList: [{
            // [Optional] The label will not be displayed if it is empty.
            label: "",
            // For a single option, use `-` to separate the value and text, left for value, right for text
            options: [
                "newToOld-New to Old",
                "oldToNew-Old to New"
            ],
            // [Optional] {string[]} - show this option only when the category not in the list
            notShowWhen: null,
            // [Optional] {string[]} - show this option only when the category in the list
            showWhen: null
        }],
        /**
         * [Optional] load options dynamically. If `optionList` is provided, this will be ignored.
         * @since 1.5.0
         * @param category {string}
         * @param param {string?}
         * @return {Promise<{options: string[], label?: string}[]>} - return a list of option group, each group contains a list of options
         */
        optionLoader: async(category, param) => {
            return [{
                // [Optional] The label will not be displayed if it is empty.
                label: "",
                // For a single option, use `-` to separate the value and text, left for value, right for text
                options: [
                    "newToOld-New to Old",
                    "oldToNew-Old to New"
                ],
            }]
        },
        ranking: {
            // For a single option, use `-` to separate the value and text, left for value, right for text
            options: [
                "day-Day",
                "week-Week"
            ],
            /**
             * load ranking comics
             * @param option {string} - option from optionList
             * @param page {number} - page number
             * @returns {Promise<{comics: Comic[], maxPage: number}>}
             */
            load: async(option, page) => {
                /*
                ```
                let data = JSON.parse((await Network.get('...')).body)
                let maxPage = data.maxPage

                function parseComic(comic) {
                    // ...

                    return new Comic({
                        id: id,
                        title: title,
                        subTitle: author,
                        cover: cover,
                        tags: tags,
                        description: description
                    })
                }

                return {
                    comics: data.list.map(parseComic),
                    maxPage: maxPage
                }
                ```
                */
            }
        }
    }

    /// search related
    search = {
        /**
         * load search result
         * @param keyword {string}
         * @param options {string[]} - options from optionList
         * @param page {number}
         * @returns {Promise<{comics: Comic[], maxPage: number}>}
         */
        load: async(keyword, options, page) => {
            let url = `${Rawkuro.source_url}search?keyword=${keyword}`
            let res = await Network.get(url);   

            if (res.status !== 200) {
                throw `Invalid status code: ${res.status}`
            }

            // 2. 解析文档
            let doc = new HtmlDocument(res.body);
             // 3. 通用解析单元函数
             function parseDoc(doc) {
                let mangaListWrap = doc.querySelector(".grid.gtc-f141a.gg-20.p-13.mh-77vh");
                let mangaList = mangaListWrap.querySelectorAll(".b-img.full-i.i-mage.oh.relative");
                let commics = []
                for (let el of mangaList) {
                    let mangaPoster = el.querySelector("a.block.pt-140p");
                    let href = mangaPoster.attributes.href;
                    let id = mangaPoster.attributes.title;
                    let title = mangaPoster.attributes.title;
                    let img = mangaPoster.querySelector("img")
                    let cover = img.attributes["data-src"] || img.attributes.src;
                    cover = `${Rawkuro.source_url}` + cover
                    commics.push(new Comic({ id, title, cover }) );
                }
                return commics;
            }

            let comics = parseDoc(doc);
            // 7. 清理并返回
            doc.dispose();
            
            return {
                comics: comics,
                maxPage: 30
            };
        },

        /**
         * load search result with next page token.
         * The field will be ignored if `load` function is implemented.
         * @param keyword {string}
         * @param options {(string)[]} - options from optionList
         * @param next {string | null}
         * @returns {Promise<{comics: Comic[], maxPage: number}>}
         */
        loadNext: async(keyword, options, next) => {

        },

        // provide options for search
        optionList: [{
            // [Optional] default is `select`
            // type: select, multi-select, dropdown
            // For select, there is only one selected value
            // For multi-select, there are multiple selected values or none. The `load` function will receive a json string which is an array of selected values
            // For dropdown, there is one selected value at most. If no selected value, the `load` function will receive a null
            type: "select",
            // For a single option, use `-` to separate the value and text, left for value, right for text
            options: [
                "0-time",
                "1-popular"
            ],
            // option label
            label: "sort",
            // default selected options. If not set, use the first option as default
            default: null,
        }],

        // enable tags suggestions
        enableTagsSuggestions: false,
    }

    // favorite related
    favorites = {
        // whether support multi folders
        multiFolder: false,
        /**
         * add or delete favorite.
         * throw `Login expired` to indicate login expired, App will automatically re-login and re-add/delete favorite
         * @param comicId {string}
         * @param folderId {string}
         * @param isAdding {boolean} - true for add, false for delete
         * @param favoriteId {string?} - [Comic.favoriteId]
         * @returns {Promise<any>} - return any value to indicate success
         */
        addOrDelFavorite: async(comicId, folderId, isAdding, favoriteId) => {
            /*
            ```
            let res = await Network.post('...')
            if (res.status === 401) {
                throw `Login expired`;
            }
            return 'ok'
            ```
            */
        },
        /**
         * load favorite folders.
         * throw `Login expired` to indicate login expired, App will automatically re-login retry.
         * if comicId is not null, return favorite folders which contains the comic.
         * @param comicId {string?}
         * @returns {Promise<{folders: {[p: string]: string}, favorited: string[]}>} - `folders` is a map of folder id to folder name, `favorited` is a list of folder id which contains the comic
         */
        loadFolders: async(comicId) => {
            /*
            ```
            let data = JSON.parse((await Network.get('...')).body)

            let folders = {}

            data.folders.forEach((f) => {
                folders[f.id] = f.name
            })

            return {
                folders: folders,
                favorited: data.favorited
            }
            ```
            */
        },
        /**
         * add a folder
         * @param name {string}
         * @returns {Promise<any>} - return any value to indicate success
         */
        addFolder: async(name) => {
            /*
            ```
            let res = await Network.post('...')
            if (res.status === 401) {
                throw `Login expired`;
            }
            return 'ok'
            ```
            */
        },
        /**
         * delete a folder
         * @param folderId {string}
         * @returns {Promise<void>} - return any value to indicate success
         */
        deleteFolder: async(folderId) => {
            /*
            ```
            let res = await Network.delete('...')
            if (res.status === 401) {
                throw `Login expired`;
            }
            return 'ok'
            ```
            */
        },
        /**
         * load comics in a folder
         * throw `Login expired` to indicate login expired, App will automatically re-login retry.
         * @param page {number}
         * @param folder {string?} - folder id, null for non-multi-folder
         * @returns {Promise<{comics: Comic[], maxPage: number}>}
         */
        loadComics: async(page, folder) => {
            /*
            ```
            let data = JSON.parse((await Network.get('...')).body)
            let maxPage = data.maxPage

            function parseComic(comic) {
                // ...

                return new Comic{
                    id: id,
                    title: title,
                    subTitle: author,
                    cover: cover,
                    tags: tags,
                    description: description
                }
            }

            return {
                comics: data.list.map(parseComic),
                maxPage: maxPage
            }
            ```
            */
        },
        /**
         * load comics with next page token
         * @param next {string | null} - next page token, null for first page
         * @param folder {string}
         * @returns {Promise<{comics: Comic[], next: string?}>}
         */
        loadNext: async(next, folder) => {

        },
        /**
         * If the comic source only allows one comic in one folder, set this to true.
         */
        singleFolderForSingleComic: false,
    }

    /// single comic related
    comic = {
        /**
         * load comic info
         * @param id {string}
         * @returns {Promise<ComicDetails>}
         */
        loadInfo: async(id) => {
            let res = await Network.get(`${id}`);

            if (res.status !== 200) {
                throw `Invalid status code: ${res.status}`
            }

            // 2. 解析文档
            let doc = new HtmlDocument(res.body);
            console.log("Load comic info: " + id);
            console.log("res: " +  JSON.stringify(res, null, 2));
            console.log("body: " + res.body);
            let allUls = doc.querySelectorAll("ul");
            console.log("页面中总共有 " + allUls.length + " 个 ul 元素");

            // 安全地获取内容
            let getContent = (doc) => {
                if (!doc) return "doc是null或undefined";
                
                // 尝试多种方式获取HTML内容
                if (doc.innerHTML) return doc.innerHTML;
                if (doc.documentElement?.innerHTML) return doc.documentElement.innerHTML;
                if (doc.body?.innerHTML) return doc.body.innerHTML;
                if (doc.firstChild?.innerHTML) return doc.firstChild.innerHTML;
                
                // 如果都没有，返回doc的字符串表示
                return JSON.stringify(doc, null, 2);
            };
            
            let content = getContent(doc);
            console.log("文档内容长度:", content.length);
            console.log("文档内容预览:", content.substring(0, 1000));

            // 3. 通用解析单元函数
            function parseDoc(doc) {
                let manga = doc.querySelector(".grid.gtc-235fr.max-w-1200.mra.mla.mtn150.relative.gg-15");
                let title = doc.querySelector(".mt-0.mb-6.fs-20")?.text?.trim() || "";
                let img = manga.querySelector("img")
                let cover = img.attributes["data-src"] || img.attributes.src;
                cover = `${Rawkuro.source_url}` + cover;
                let description = doc.querySelector(".syn-target")?.text?.trim() || "";
                let chapters = new Map()
                let uls = doc.querySelector(".bc-fff.s1.r2.p-13");
                let ul = uls.querySelector("ul");
                if (!ul) {
                    console.error("找不到ul.myUL");
                    return;
                }
                let series = ul.querySelectorAll("li.chapter");
                console.log("Find Chapters: " + series.length);
                for(let e of Array.from(series)) {
                    let li = e;
                    let item = li.querySelector("a");
                    let href = item.attributes.href;
                    let title = li.attributes.data?.trim() || "";
                    chapters.set(href, title)
                }
                return new ComicDetails({
                    title: title,
                    cover: cover,
                    description: description,
                    tags: {},
                    chapters: chapters,
                });
            }

            let comicDetails = parseDoc(doc)
            // 7. 清理并返回
            doc.dispose();

            return comicDetails;
        },

        /**
         * rate a comic
         * @param id
         * @param rating {number} - [0-10] app use 5 stars, 1 rating = 0.5 stars,
         * @returns {Promise<any>} - return any value to indicate success
         */
        starRating: async(id, rating) => {

        },

        /**
         * load images of a chapter
         * @param comicId {string}
         * @param epId {string?}
         * @returns {Promise<{images: string[]}>}
         */
        loadEp: async(comicId, epId) => {
            let href = epId
            let res = await Network.get(href, Rawkuro.headers);

            if (res.status !== 200) {
                throw `Invalid status code: ${res.status}`
            }

            // 2. 解析文档
            let doc = new HtmlDocument(res.body);
            console.log(res.body);
            let allScripts = doc.querySelectorAll("script");
            console.log("页面中总共有 " + allScripts.length + " 个 script 元素");
            // 方法2：使用 match（更简洁）
            const chapterId = res.body.match(/const\s+CHAPTER_ID\s*=\s*(\d+);/)?.[1];
            if (chapterId) {
                console.log("Chapter ID: " + chapterId);
            } else {
                throw new Error("Chapter ID not found");
            }
            if (!doc) {
                throw `Doc not found`;
            }

            let id = chapterId;

            console.log("Find Chapter ID: " + id);
            // 3. 通用解析单元函数
            let result = await Network.get(`${Rawkuro.source_url}ajax/image/list/chap/${id}`, {
                "Accept": "application/json",
                "Referer": Rawkuro.source_url,
            });
            if (result.status !== 200) {
                throw `Invalid status code: ${result.status}`
            }
            let data = JSON.parse(result.body);
            let html = data.html;
            // 同时匹配data-index和href
            const pattern = /data-index="(\d+)"[^>]*>\s*<a href="([^"]+)"[^>]*>/g;
            const matches = [...html.matchAll(pattern)];

            const imgUrls = matches
                .map(m => ({
                    index: parseInt(m[1]),
                    url: m[2]
                }))
                .sort((a, b) => a.index - b.index)
                .map(item => item.url);
            // 7. 清理并返回
            doc.dispose();

            return {
                // string[]
                images: imgUrls
            }
        },
        /**
         * [Optional] provide configs for an image loading
         * @param url
         * @param comicId
         * @param epId
         * @returns {ImageLoadingConfig | Promise<ImageLoadingConfig>}
         */
        onImageLoad: (url, comicId, epId) => {
            return {}
        },
        /**
         * [Optional] provide configs for a thumbnail loading
         * @param url {string}
         * @returns {ImageLoadingConfig | Promise<ImageLoadingConfig>}
         *
         * `ImageLoadingConfig.modifyImage` and `ImageLoadingConfig.onLoadFailed` will be ignored.
         * They are not supported for thumbnails.
         */
        onThumbnailLoad: (url) => {
            return {}
        },
        /**
         * [Optional] like or unlike a comic
         * @param id {string}
         * @param isLike {boolean} - true for like, false for unlike
         * @returns {Promise<void>}
         */
        likeComic: async(id, isLike) => {

        },
        /**
         * [Optional] load comments
         *
         * Since app version 1.0.6, rich text is supported in comments.
         * Following html tags are supported: ['a', 'b', 'i', 'u', 's', 'br', 'span', 'img'].
         * span tag supports style attribute, but only support font-weight, font-style, text-decoration.
         * All images will be placed at the end of the comment.
         * Auto link detection is enabled, but only http/https links are supported.
         * @param comicId {string}
         * @param subId {string?} - ComicDetails.subId
         * @param page {number}
         * @param replyTo {string?} - commentId to reply, not null when reply to a comment
         * @returns {Promise<{comments: Comment[], maxPage: number?}>}
         */
        loadComments: async(comicId, subId, page, replyTo) => {
            /*
            ```
            // ...

            return {
                comments: data.results.list.map(e => {
                    return new Comment({
                        // string
                        userName: e.user_name,
                        // string
                        avatar: e.user_avatar,
                        // string
                        content: e.comment,
                        // string?
                        time: e.create_at,
                        // number?
                        replyCount: e.count,
                        // string
                        id: e.id,
                    })
                }),
                // number
                maxPage: data.results.maxPage,
            }
            ```
            */
        },
        /**
         * [Optional] send a comment, return any value to indicate success
         * @param comicId {string}
         * @param subId {string?} - ComicDetails.subId
         * @param content {string}
         * @param replyTo {string?} - commentId to reply, not null when reply to a comment
         * @returns {Promise<any>}
         */
        sendComment: async(comicId, subId, content, replyTo) => {

        },
        /**
         * [Optional] like or unlike a comment
         * @param comicId {string}
         * @param subId {string?} - ComicDetails.subId
         * @param commentId {string}
         * @param isLike {boolean} - true for like, false for unlike
         * @returns {Promise<void>}
         */
        likeComment: async(comicId, subId, commentId, isLike) => {

        },
        /**
         * [Optional] vote a comment
         * @param id {string} - comicId
         * @param subId {string?} - ComicDetails.subId
         * @param commentId {string} - commentId
         * @param isUp {boolean} - true for up, false for down
         * @param isCancel {boolean} - true for cancel, false for vote
         * @returns {Promise<number>} - new score
         */
        voteComment: async(id, subId, commentId, isUp, isCancel) => {

        },
        // {string?} - regex string, used to identify comic id from user input
        idMatch: null,
        /**
         * [Optional] Handle tag click event
         * @param namespace {string}
         * @param tag {string}
         * @returns {PageJumpTarget}
         */
        onClickTag: (namespace, tag) => {
            /*
            ```
            return new PageJumpTarget({
                page: 'search',
                keyword: tag,
            })
            ```
             */
        },
        /**
         * [Optional] Handle links
         */
        link: {
            /**
             * set accepted domains
             */
            domains: [
                'example.com'
            ],
            /**
             * parse url to comic id
             * @param url {string}
             * @returns {string | null}
             */
            linkToId: (url) => {

            }
        },
        // enable tags translate
        enableTagsTranslate: false,
    }


    /*
    [Optional] settings related
    Use this.loadSetting to load setting
    ```
    let setting1Value = this.loadSetting('setting1')
    console.log(setting1Value)
    ```
     */
    settings = {
        setting1: {
            // title
            title: "Setting1",
            // type: input, select, switch
            type: "select",
            // options
            options: [{
                // value
                value: 'o1',
                // [Optional] text, if not set, use value as text
                text: 'Option 1',
            }, ],
            default: 'o1',
        },
        setting2: {
            title: "Setting2",
            type: "switch",
            default: true,
        },
        setting3: {
            title: "Setting3",
            type: "input",
            validator: null, // string | null, regex string
            default: '',
        },
        setting4: {
            title: "Setting4",
            type: "callback",
            buttonText: "Click me",
            /**
             * callback function
             *
             * If the callback function returns a Promise, the button will show a loading indicator until the promise is resolved.
             * @returns {void | Promise<any>}
             */
            callback: () => {
                // do something
            }
        }
    }

    // [Optional] translations for the strings in this config
    translation = {
        'zh_CN': {
            'Setting1': '设置1',
            'Setting2': '设置2',
            'Setting3': '设置3',
        },
        'zh_TW': {},
        'en': {}
    }
}