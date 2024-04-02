/*
Last Modified time : 20230926 11:00 by https://immmmm.com
*/
let bbMemo = {
  memos: 'https://demo.usememos.com/',
  limit: '10',
  creatorId: '1',
  domId: '#bber',
  twiEnv:'',
}
if(typeof(bbMemos) !=="undefined"){
  for(let key in bbMemos) {
    if(bbMemos[key]){
      bbMemo[key] = bbMemos[key];
    }
  }
}

function loadCssCode(code){
  let style = document.createElement('style');
  style.type = 'text/css';
  style.rel = 'stylesheet';
  style.appendChild(document.createTextNode(code));
  let head = document.getElementsByTagName('head')[0];
  head.appendChild(style);
}

let limit = bbMemo.limit
let memos = bbMemo.memos
let memosOpenId
let mePage = 1,offset = 0,nextLength = 0,nextDom='',apiV1 = '';
let bbDom = document.querySelector(bbMemo.domId);
let load = '<div class="bb-load"><button class="load-btn button-load">加载中……</button></div>'
let loading = `<div class="loader"><svg class="circular" viewBox="25 25 50 50"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>`

if(bbDom){
  fetchStatus()
}
async function fetchStatus() {
  let statusUrl = memos+"api/v1/ping";
  let response = await fetch(statusUrl);
  if (response.ok) {
    apiV1 = 'v1/'
  }
  let memoOne = getQueryVariable("memo") || ''
  if(memoOne){
    getMemoOne(memoOne)
  }else{
    newApiV1(apiV1)
  }
}
function getMemoOne(memoOne){
  let OneDom = `<iframe style="width:100%;height:100vh;" src="${memoOne}" frameBorder="0"></iframe>`
  let ContDom = document.querySelector('.content') || document.querySelector(bbMemo.domId);
  ContDom.innerHTML = OneDom
}
function getQueryVariable(variable){
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if(pair[0] == variable){return pair[1];}
  }
  return(false);
}

function newApiV1(apiV1){
  getFirstList(apiV1) //首次加载数据
  meNums(apiV1) //加载总数
  bbDom.innerHTML = loading
  let btn = document.querySelector("button.button-load");
  btn.addEventListener("click", function () {
    btn.textContent= '加载中……';
    if(bbMemo.twiEnv){
      updateTiwkoo(nextDom)
    }else{
      updateHTMl(nextDom)
    }
    if(nextLength < limit){ //返回数据条数小于限制条数，隐藏
      document.querySelector("button.button-load").remove()
      return
    }
    getNextList(apiV1)
  });
}

function getFirstList(apiV1){
  bbDom.insertAdjacentHTML('afterend', load);
  let bbUrl = memos+"api/"+apiV1+"memo?creatorId="+bbMemo.creatorId+"&rowStatus=NORMAL&limit="+limit;
  fetch(bbUrl).then(res => res.json()).then( resdata =>{
    if(bbMemo.twiEnv){
      updateTiwkoo(resdata)
    }else{
      updateHTMl(resdata)
    }
    let nowLength = resdata.length
    if(nowLength < limit){ //返回数据条数小于 limit 则直接移除“加载更多”按钮，中断预加载
      document.querySelector("button.button-load").remove()
      return
    }
    mePage++
    offset = limit*(mePage-1)
    getNextList(apiV1)
  });
}
// 获取评论数量
function updateTiwkoo(data) {
  console.log(data)
  let twiID = data.map((item) => memos + "m/" + item.id);
  twikoo.getCommentsCount({
    envId: bbMemo.twiEnv,
    urls: twiID,
    includeReply: true
  }).then(function (res) {
    updateCount(res)
  }).catch(function (err) {
    console.error(err);
  });
  function updateCount(res) {
    let twiCount = res.map((item) => {
      return Object.assign({},{'count':item.count})
    });

    let bbTwikoo = data.map((item,index) => {
      return {...item, ...twiCount[index]};
    });
    updateHTMl(bbTwikoo)
  }
}
//预加载下一页数据
function getNextList(apiV1){
  let bbUrl = memos+"api/"+apiV1+"memo?creatorId="+bbMemo.creatorId+"&rowStatus=NORMAL&limit="+limit+"&offset="+offset;
  fetch(bbUrl).then(res => res.json()).then( resdata =>{
    nextDom = resdata
    nextLength = resdata.length
    mePage++
    offset = limit*(mePage-1)
    if(nextLength < 1){ //返回数据条数为 0 ，隐藏
      document.querySelector("button.button-load").remove()
      return
    }
  })
}
//加载总 Memos 数
function meNums(apiV1){
  let bbLoad = document.querySelector('.bb-load')
  let bbUrl = memos+"api/"+apiV1+"memo/stats?creatorId="+bbMemo.creatorId
  fetch(bbUrl).then(res => res.json()).then( resdata =>{
    if(resdata){
      let allnums = `<div id="bb-footer"><p class="bb-allnums">共 ${resdata.length} 条 </p><p class="bb-allpub"><a href="https://immmmm.com/bbs/" target="_blank">Memos Public</a></p></div>`
      bbLoad.insertAdjacentHTML('afterend', allnums);
    }
  })
}
// 插入 html 
async function updateHTMl(data){
  //console.log(data)
  let result="",resultAll="";
  const TAG_REG = /#([^#\s!.,;:?"'()]+)(?= )/g ///#([^/\s#]+?) /g
  , IMG_REG = /\!\[(.*?)\]\((.*?)\)/g
  , LINK_REG = /\[(.*?)\]\((.*?)\)/g
  , DEODB_LINK_REG = /(https:\/\/(www|movie|book)\.douban\.com\/(game|subject)\/[0-9]+\/).*?/g
  , BILIBILI_REG = /<a.*?href="https:\/\/www\.bilibili\.com\/video\/((av[\d]{1,10})|(BV([\w]{10})))\/?".*?>.*<\/a>/g
  , NETEASE_MUSIC_REG = /<a.*?href="https:\/\/music\.163\.com\/.*id=([0-9]+)".*?>.*<\/a>/g
  , QQMUSIC_REG = /<a.*?href="https\:\/\/y\.qq\.com\/.*(\/[0-9a-zA-Z]+)(\.html)?".*?>.*?<\/a>/g
  , QQVIDEO_REG = /<a.*?href="https:\/\/v\.qq\.com\/.*\/([a-z|A-Z|0-9]+)\.html".*?>.*<\/a>/g
  , YOUKU_REG = /<a.*?href="https:\/\/v\.youku\.com\/.*\/id_([a-z|A-Z|0-9|==]+)\.html".*?>.*<\/a>/g
  , YOUTUBE_REG = /<a.*?href="https:\/\/www\.youtube\.com\/watch\?v\=([a-z|A-Z|0-9]{11})\".*?>.*<\/a>/g;
  marked.setOptions({
    breaks: false,
    smartypants: false,
    langPrefix: 'language-',
    headerIds: false,
    mangle: false
  });
  
  for(let i=0;i < data.length;i++){
      let bbID = data[i].id
      let memoUrl = memos + "m/" + bbID
      let bbCont = data[i].content + ' '
      let bbContREG = ''

      bbContREG += bbCont.replace(TAG_REG, "")
        .replace(IMG_REG, "")
        .replace(DEODB_LINK_REG, '')
        .replace(LINK_REG, '<a class="primary" href="$2" target="_blank">$1</a>')

      // NeoDB
      let neodbArr = bbCont.match(DEODB_LINK_REG);
      let neodbDom = '';
      if(neodbArr){
        for(let k=0;k < neodbArr.length;k++){
          neodbDom += await fetchNeoDB(neodbArr[k])
        }
      }

      //标签
      let tagArr = bbCont.match(TAG_REG);
      let bbContTag = '';
      if (tagArr) {
        bbContTag = tagArr.map(t=>{
          return `<span class='tag-span' onclick='getTagNow(this)'>${t}</span> `;
        }).join('');
        bbContREG =  bbContTag + bbContREG.trim()
      }
            
      bbContREG = marked.parse(bbContREG)
        .replace(BILIBILI_REG, "<div class='video-wrapper'><iframe src='//www.bilibili.com/blackboard/html5mobileplayer.html?bvid=$1&as_wide=1&high_quality=1&danmaku=0' scrolling='no' border='0' frameborder='no' framespacing='0' allowfullscreen='true'></iframe></div>")
        .replace(NETEASE_MUSIC_REG, "<meting-js auto='https://music.163.com/#/song?id=$1'></meting-js>")
        .replace(QQMUSIC_REG, "<meting-js auto='https://y.qq.com/n/yqq/song$1.html'></meting-js>")
        .replace(QQVIDEO_REG, "<div class='video-wrapper'><iframe src='//v.qq.com/iframe/player.html?vid=$1' allowFullScreen='true' frameborder='no'></iframe></div>")
        .replace(YOUKU_REG, "<div class='video-wrapper'><iframe src='https://player.youku.com/embed/$1' frameborder=0 'allowfullscreen'></iframe></div>")
        .replace(YOUTUBE_REG, "<div class='video-wrapper'><iframe src='https://www.youtube.com/embed/$1' title='YouTube video player' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen title='YouTube Video'></iframe></div>")

      //解析 content 内 md 格式图片
      let IMG_ARR = data[i].content.match(IMG_REG) || '',IMG_ARR_Grid='';
      if(IMG_ARR){
        let IMG_ARR_Length = IMG_ARR.length,IMG_ARR_Url = '';
        if(IMG_ARR_Length !== 1){let IMG_ARR_Grid = " grid grid-"+IMG_ARR_Length}
        IMG_ARR.forEach(item => {
            let imgSrc = item.replace(/!\[.*?\]\((.*?)\)/g,'$1')
            IMG_ARR_Url += `<figure class="gallery-thumbnail"><img class="img thumbnail-image" loading="lazy" decoding="async" src="${imgSrc}"/></figure>`
        });
        bbContREG += `<div class="resimg${IMG_ARR_Grid}">${IMG_ARR_Url}</div>`
      }

      //解析内置资源文件
      if(data[i].resourceList && data[i].resourceList.length > 0){
        let resourceList = data[i].resourceList;
        let imgUrl='',resUrl='',resImgLength = 0;
        for(let j=0;j < resourceList.length;j++){
          let restype = resourceList[j].type.slice(0,5)
          let resexlink = resourceList[j].externalLink
          let resLink = resexlink ? resexlink : 
                        memos+'o/r/'+resourceList[j].id+'/'+(resourceList[j].publicId || resourceList[j].filename)

          if(restype == 'image'){
            imgUrl += `<figure class="gallery-thumbnail"><img class="img thumbnail-image" src="${resLink}"/></figure>`
            resImgLength = resImgLength + 1 
          }else if(restype == 'video'){
            imgUrl += `<div class="video-wrapper"><video controls><source src="${resLink}" type="video/mp4"></video></div>`
          }else{
            resUrl += `<a target="_blank" rel="noreferrer" href="${resLink}">${resourceList[j].filename}</a>`
          }
        }
        if(imgUrl){
          let resImgGrid = ""
          if(resImgLength !== 1){resImgGrid = "grid grid-"+resImgLength}
          bbContREG += `<div class="resimg ${resImgGrid}">${imgUrl}</div>`
        }
        if(resUrl){
          bbContREG += `<p class="bb-source">${resUrl}</p>`
        }
      }
      let memosIdNow = memos.replace(/https\:\/\/(.*\.)?(.*)\..*/,'id-$2-')
      let emojiReaction = `<emoji-reaction theme="system" class="reaction" endpoint="https://api-emaction.immmmm.com" reacttargetid="${memosIdNow+'memo-'+bbID}" style="line-height:normal;display:inline-flex;"></emoji-reaction>`
      let datacountDOM = ""
      if(bbMemo.twiEnv){
        datacountDOM = `<div class="datacount" data-twienv="${bbMemo.twiEnv}" data-id="${bbID}" onclick="loadTwikoo(this)"> ${data[i].count} 条评论 </div>`
      }
      memosOpenIdNow = window.localStorage && window.localStorage.getItem("memos-access-token")

      result +=  `<li class="memo-${bbID}">
        <div class="bb-item">

        ${neodbDom}
          <div class="bb-tool">
            ${emojiReaction}
            ${ !memosOpenIdNow ? '':
              `<span class="archive-btn" onclick="archiveMemo(this)" data-id="${bbID}"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-img"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg></span>`
            }
          </div>
          <div class="bb-cont">
            ${bbContREG}
          </div>
          <div class="bb-info">
            <a href="${memoUrl}" target="_blank"><span class="datatime">${new Date(data[i].createdTs * 1000).toLocaleString()}</span></a>
            ${datacountDOM}
          </div>
          <div class="item-twikoo twikoo-${bbID} d-none">
            <div id="twikoo-${bbID}"></div>
          </div>
        </div>
      </li>`
  }// end for
  let bbBefore = "<section class='bb-timeline'><ul class='bb-list-ul'>"
  let bbAfter = "</ul></section>"
  resultAll = bbBefore + result + bbAfter
  let loaderDom = document.querySelector('.loader') || ""
  if(loaderDom) loaderDom.remove()
  bbDom.insertAdjacentHTML('beforeend', resultAll);
  if(document.querySelector('button.button-load')) document.querySelector('button.button-load').textContent = '加载更多';

  //图片灯箱
  window.ViewImage && ViewImage.init('.bb-cont img')
  //相对时间
  window.Lately && Lately.init({ target: '.datatime' });
}

// Fetch NeoDB
async function fetchNeoDB(url){
  let urlNow = "https://api-neodb.immmmm.com/?url="+url
  let response = await fetch(urlNow);
  let dbFetch = await response.json();
  let neodbDom = `<div class="db-card">
    <div class="db-card-subject">
        <div class="db-card-post"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${dbFetch.cover_image_url}"></div>
        <div class="db-card-content">
            <div class="db-card-title"><a href="${url}" class="cute" target="_blank" rel="noreferrer">${dbFetch.title}</a></div>
            <div class="rating"><span class="allstardark"><span class="allstarlight" style="width:${dbFetch.rating*10}%"></span></span><span class="rating_nums">${dbFetch.rating}</span></div>
            <div class="db-card-abstract">${dbFetch.brief}</div>
        </div>
        <div class="db-card-cate">${dbFetch.category}</div>
    </div>
  </div>`
  return neodbDom
}

//获取指定 Tag 评论
function getTagNow(e){
  let tagHtml = `<div id="tag-list"></div>`
  bbDom.insertAdjacentHTML('beforebegin', tagHtml);
  let tagName = e.innerHTML.replace('#','')
  let domClass = document.getElementById("tag-list")
  window.scrollTo({
    top: domClass.offsetTop - 20,
    behavior: "smooth"
  });
  let tagHtmlNow = `<span class='tag-span' onclick='reLoad()'>${e.innerHTML}</span>`
  document.querySelector('#tag-list').innerHTML = tagHtmlNow
  let bbUrl = memos+"api/"+apiV1+"memo?creatorId="+bbMemo.creatorId+"&tag="+tagName+"&limit=20";
  fetchMemoDOM(bbUrl)
}

//随机一条 Memos 需手动添加 html 如：<span onclick="randomMemo()">回忆</span>
function randomMemo(){
  let randomUrl1 = memos+"api/"+apiV1+"memo/stats?creatorId="+bbMemo.creatorId;
  fetch(randomUrl1).then(res => res.json()).then( resdata =>{
    let randomNum = Math.floor(Math.random() * (resdata.length)) + 1;
    let randomUrl2 = memos+"api/"+apiV1+"memo?creatorId="+bbMemo.creatorId+"&rowStatus=NORMAL&limit=1&offset="+randomNum
    fetchMemoDOM(randomUrl2)
  })
}

//搜索 Memo ，基于 v1 api，需手动添加 html 如：<span onclick="serchMemo()">搜索</span>
function serchMemo(){
  let serchText = prompt('搜点啥？','');
  let tagHtmlNow = `<span class='tag-span' onclick='reLoad()'>#${serchText}</span>`
  let tagHtml = `<div id="tag-list">${tagHtmlNow}</div>`
  bbDom.insertAdjacentHTML('beforebegin', tagHtml);
  let bbUrl = memos+"api/"+apiV1+"memo?creatorId="+bbMemo.creatorId+"&content="+serchText+"&limit=20";
  fetchMemoDOM(bbUrl)
}

function fetchMemoDOM(bbUrl){
  bbDom.innerHTML = loading
  fetch(bbUrl).then(res => res.json()).then( resdata =>{
    if(resdata.length > 0){
      document.querySelector(bbMemo.domId).innerHTML = ""
      if(document.querySelector("button.button-load")) document.querySelector("button.button-load").remove()
      if(bbMemo.twiEnv){
        updateTiwkoo(resdata)
      }else{
        updateHTMl(resdata)
      }
    }else{
      alert("404 -_-!")
      setTimeout(reLoad(), 1000);
    }
  })
}

function reLoad(){
  let urlThis = location.protocol + '//' + location.host + location.pathname;
  window.location.replace(urlThis)
}

//设置 openid Memos OpenId
function setOpenID(){
  let memosOpenIdNow = window.localStorage && window.localStorage.getItem("memos-access-token") || ''
  let memosOpenIdSet = prompt('请输入 Memos OpenId ',memosOpenIdNow);
  if(memosOpenIdSet !== null ) window.localStorage && window.localStorage.setItem("memos-access-token", memosOpenIdSet);
}

//归档 Memo
function archiveMemo(e) {
  let memoId = e.getAttribute("data-id")
  let memosOpenIdNow = window.localStorage && window.localStorage.getItem("memos-access-token");
  if(memosOpenIdNow && memosOpenIdNow !== 'undefined' && memoId){
    let isOk = confirm("确认归档？");
    if(isOk){
      let memoUrl = memos+"api/"+apiV1+"memo/"+memoId
      let memoBody = {id:memoId,rowStatus:"ARCHIVED"};
      fetch(memoUrl, {
        method: 'PATCH',
        body: JSON.stringify(memoBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer '+ memosOpenIdNow
        }
      }).then(function(res) {
        if (res.ok) {
          randomMemo()
          //reLoad()
        }
      })
    }
  }else{
    setOpenID()
  }
}

//显示标签列表，需配合 cloudflare worker 食用
function showTaglist(e){
  let bbUrl = e.getAttribute("data-api")
  let tagListDom = ""
  fetch(bbUrl).then(res => res.json()).then( resdata =>{
    for(let i=0;i < resdata.length;i++){
      tagListDom += `<span class="tag-span" onclick='getTagNow(this)'>#${resdata[i]}</span>`
    }
    let tagHtml = `<div id="tag-list-all">${tagListDom}</div>`
    bbDom.insertAdjacentHTML('beforebegin', tagHtml);
  })
}

//前端加载 Twikoo 评论
function loadTwikoo(e) {
  let memoEnv = e.getAttribute("data-twienv")
  let memoId = e.getAttribute("data-id")
  let twikooDom = document.querySelector('.twikoo-'+memoId);
  if (twikooDom.classList.contains('d-none')) {
    document.querySelectorAll('.item-twikoo').forEach((item) => {item.classList.add('d-none');})
    if(!document.getElementById("twikoo")){
      twikooDom.classList.remove('d-none');
      let domClass = document.getElementsByClassName('memo-'+memoId)
      window.scrollTo({
        top: domClass[0].offsetTop - 30,
        behavior: "smooth"
      });
      twikoo.init({
        envId: memoEnv,
        el: '#twikoo-' + memoId,
        path: bbMemo.memos+'m/'+ memoId,
      });
      setTimeout(function(){
        document.getElementById("twikoo").id='twikoo-' + memoId;
      }, 600);
      let memoOne = location.pathname+'?memo='+bbMemos.memos+'m/'+memoId
      history.pushState({memoOne: memoOne, title: document.title}, document.title, memoOne)
    }
  }else{
    twikooDom.classList.add('d-none');
  }
}
//前端加载 Artalk 评论
function loadArtalk(e) {
  let memoEnv = e.getAttribute("data-artenv")
  let memoSite= e.getAttribute("data-artsite")
  let memoId = e.getAttribute("data-id")
  let ArtalkDom = document.querySelector('.artalk-'+memoId);
  let ArtalkDom_ID = document.querySelector('#artalk-'+memoId);
  if(!ArtalkDom_ID){
    ArtalkDom.insertAdjacentHTML('afterbegin', '<div id="artalk-'+ memoId +'"></div>');
  }
  if (ArtalkDom.classList.contains('d-none')) {
    document.querySelectorAll('.item-artalk').forEach((item) => {item.classList.add('d-none');})
    if(!document.getElementById("artalk")){
      ArtalkDom.classList.remove('d-none');
      let domClass = document.getElementsByClassName('memo-'+memoId)
      window.scrollTo({
        top: domClass[0].offsetTop - 30,
        behavior: "smooth"
      });
      Artalk.init({
        el: '#artalk-' + memoId,
        pageKey: '/m/' + memoId,
        pageTitle: '',
        site: memoSite,
        server: memoEnv
      });
    }
  }else{
    ArtalkDom.classList.add('d-none');
    ArtalkDom_ID.remove();
  }
}
