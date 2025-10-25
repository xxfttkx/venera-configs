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

class Jmanga extends ComicSource {
    // Note: The fields which are marked as [Optional] should be removed if not used

    // name of the source
    name = "jmanga"

    // unique id of the source
    key = "jmanga"

    version = "1.0.0"

    minAppVersion = "1.4.0"

    // update url
    url = ""

    source_url = "https://jmanga.tel/"

    // explore page list
    explore = [{
        // title of the page.
        // title is used to identify the page, it should be unique
        title: "jmanga",

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
            let res = await Network.get(`${this.source_url}home/`);

            if (res.status !== 200) {
                throw `Invalid status code: ${res.status}`
            }

            // 2. 解析文档
            let doc = new HtmlDocument(res.body);
            let count = 0;
            // 3. 通用解析单元函数
            function parseItem(el) {
                let manga = el.querySelector("a.manga-poster");
                let href = manga.attributes.href;
                let title = href.split("/read/")[1].split("-raw")[0];
                let id = count;
                count += 1
                let img = manga.querySelector("img")
                let cover = img.attributes.src;
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
            for (let comic of latest)
                console.log(comic)
            return comics;
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
        title: "",
        parts: [{
            // title of the part
            name: "Theme",

            // fixed or random or dynamic
            // if random, need to provide `randomNumber` field, which indicates the number of comics to display at the same time
            // if dynamic, need to provide `loader` field, which indicates the function to load comics
            type: "fixed",

            // Remove this if type is dynamic
            categories: [{
                label: "Category1",
                /**
                 * @type {PageJumpTarget}
                 */
                target: {
                    page: "category",
                    attributes: {
                        category: "category1",
                        param: null,
                    },
                },
            }, ]

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

        },
        /**
         * [Optional] load thumbnails of a comic
         *
         * To render a part of an image as thumbnail, return `${url}@x=${start}-${end}&y=${start}-${end}`
         * - If width is not provided, use full width
         * - If height is not provided, use full height
         * @param id {string}
         * @param next {string?} - next page token, null for first page
         * @returns {Promise<{thumbnails: string[], next: string?}>} - `next` is next page token, null for no more
         */
        loadThumbnails: async(id, next) => {
            /*
            ```
            let data = JSON.parse((await Network.get('...')).body)

            return {
                thumbnails: data.list,
                next: next,
            }
            ```
            */
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
            /*
            ```
            return {
                // string[]
                images: images
            }
            ```
            */
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