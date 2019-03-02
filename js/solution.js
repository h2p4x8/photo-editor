'use strict';

class ImageEditor {
  constructor( editor ) {
    this.editor = editor;
    this.menu = this.editor.querySelector('.menu');
    this.errorContainer = this.editor.querySelector('.error');
    this.errorMessage = this.errorContainer.querySelector('.error__message');
    this.drag = this.menu.querySelector('.drag');
    this.dragTools = {
      movedPiece: null,
      shiftX: 0,
      shiftY: 0,
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0
    }
    this.modeButtons = this.menu.querySelectorAll('.mode');
    this.image = this.editor.querySelector('.current-image');
    this.downloadNew = this.menu.querySelector('.new');
    this.burgerButton = this.menu.querySelector('.burger');
    this.menuToggle = this.menu.querySelectorAll('.menu__toggle');
    this.commentForm = this.editor.querySelector('.comments__form');
    this.draw = this.menu.querySelector('.draw');
    this.isDrawing = false;
    this.isComment = false;
    this.drawTools = this.menu.querySelectorAll('.menu__color');
    this.loader = this.editor.querySelector('.image-loader');
    this.share = this.menu.querySelector('.share');
    this.menuUrl = this.menu.querySelector('.menu__url');
    this.commentsMode = this.menu.querySelector('.comments');
    this.copyButton = this.menu.querySelector('.menu_copy');
    this.resizeObserver = new ResizeObserver(entries => {
          for (let entry of entries) {
            while (entry.target.offsetHeight > 66) {
               entry.target.style.left = (this.editor.offsetWidth - entry.target.offsetWidth) - 5 + 'px';
            }
          }
    });
    this.makeCanvas();
    this.registerEvents();
    this.isNew();
    this.resizeObserver.observe(this.menu);
  }
  registerEvents() {
    document.addEventListener('mousedown', event => this.dragStart(event));
    document.addEventListener('mousemove', event => this.dragObj(event));
    document.addEventListener('mouseup', event => this.dropMenu());
    this.downloadNew.addEventListener('change', event => this.loadImage(event))
    this.editor.addEventListener('dragover', event => event.preventDefault())
    this.editor.addEventListener('drop', ( event ) => {
      event.preventDefault();
      if (this.imageInfo) {
        this.showError(true, false);
        setTimeout(() => {
          this.errorContainer.style.display = 'none';
        }, 2000)
        return;
      }
      this.loadImage( event );
    })
    this.burgerButton.addEventListener('click', () => this.showMenu());
    this.modeButtons.forEach( (el) => {
      if (el.classList.contains('new')) {
        return;
      }
      el.addEventListener('click', event => this.showInnerEl(event))
    })
    this.menuToggle.forEach((el) => {
      el.addEventListener('change', ()=>{
        if (el.checked) {
          this.showComments(el.value)
        }
        return;
      })
    })
    document.addEventListener('click', (event)=>{
      if (this.isComment && event.target === this.comBox) {
        console.log(event.target)
        this.showComForm();
        this.makeCommentForm(event);
      }
      return;
    })
    this.draw.addEventListener('click', () => {
      this.isDrawing = true;
      this.comBox.style.zIndex = 0;
      this.ctx.style.zIndex = 1;
      const color = Array.from(this.drawTools).find( el => el.checked);
      this.drawing(color.value);
    })
    for (let color of this.drawTools) {
      color.addEventListener('change', () => {
        if (color.checked) {
          this.drawing(color.value);
        }
      })
    }
    this.commentsMode.addEventListener('click', ()=>{
      this.isComment = true;
      this.comBox.style.zIndex = 1;
      this.ctx.style.zIndex = 0;
    })
    this.copyButton.addEventListener('click', () => {
      event.preventDefault();
      this.menuUrl.select();
      document.execCommand('copy');
    })
  }
  showError(isShow = true, isWrongType = true) {
    this.errorMessage.textContent = isWrongType ? 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.' : 'Чтобы загрузить новое изображение, пожалуйста воспользуйтесь пунктом "Загрузить новое" в меню.'
    this.errorContainer.style.display = isShow ? 'block' : 'none';
  }
  dragStart( e ) {
    if (e.target.classList.contains('drag')) {
      this.dragTools.movedPiece = e.target.parentElement;
      const bounds = e.target.getBoundingClientRect();
      this.dragTools.shiftX = e.pageX - bounds.left - window.pageXOffset;
      this.dragTools.shiftY = e.pageY - bounds.top - window.pageYOffset;
      this.dragTools.minY = this.editor.offsetTop;
      this.dragTools.minX = this.editor.offsetLeft;
      this.dragTools.maxX = this.editor.offsetLeft + this.editor.offsetWidth - this.dragTools.movedPiece.offsetWidth - 1;
      this.dragTools.maxY = this.editor.offsetTop + this.editor.offsetHeight - this.dragTools.movedPiece.offsetHeight;
    }
  }
  dragObj( e ) {
    if ( this.dragTools.movedPiece ) {
      // Предотвращаем выделение текста
      e.preventDefault();
      let x = e.pageX - this.dragTools.shiftX,
          y = e.pageY - this.dragTools.shiftY;
      x = Math.min(x, this.dragTools.maxX);
      y = Math.min(y, this.dragTools.maxY);
      x = Math.max(x, this.dragTools.minX);
      y = Math.max(y, this.dragTools.minY);
      this.dragTools.movedPiece.style.left = x + 'px';
      this.dragTools.movedPiece.style.top = y + 'px';
    }
  }
  dropMenu(){
    if ( this.dragTools.movedPiece ) {
      sessionStorage.setItem('menuPosLeft', this.dragTools.movedPiece.style.left);
      sessionStorage.setItem('menuPosTop', this.dragTools.movedPiece.style.top);
      this.dragTools.movedPiece = null;
    }
  }
  loadImage ( e ){
    this.showError(false);
    const img = DragEvent.prototype.isPrototypeOf(e) ? e.dataTransfer.files[0] : e.target.files[0];
    const imageTypeRegExp = /^image\/jpeg|png/;

    if (!imageTypeRegExp.test(img.type)) {
      this.showError();
      return;
    }
    if (this.imageInfo) {
      document.querySelectorAll('.comments__form').forEach(( el ) => {
        el.remove()
      })
      this.mask.src = './pic/clearMask.png';
      this.ctx.getContext('2d').clearRect(0, 0, this.ctx.width, this.ctx.height);
    }

    this.image.src = URL.createObjectURL(img);
    this.image.addEventListener('load', event => {
      URL.revokeObjectURL(event.target.src);
      this.refreshCanvas();
    });
    //кидать на сервер
    this.sendPic(img);
  }
  showMenu () {
    this.isDrawing = false;
    this.isComment = false;
    this.burgerButton.style.display = 'none';
    this.modeButtons.forEach( (el) => {
      el.style.display = 'inline-block';
      el.nextElementSibling.style.display = 'none';
    })
  }
  showInnerEl( e ) {
    const prevW = this.menu.offsetWidth;
    this.burgerButton.style.display = 'inline-block';
    this.modeButtons.forEach( (el) => {
      el.style.display = 'none';
    })
    e.currentTarget.style.display = 'inline-block';
    e.currentTarget.nextElementSibling.style.display = 'inline-block';
  }
  showComments(value) {
    const comments = document.querySelectorAll('.comments__form');
    if (value === 'off') {
      comments.forEach(el => el.style.display = 'none')
      this.isComment = false;
    } else {
      comments.forEach(el => el.style.display = 'block')
      this.isComment = true;
    }
  }
  makeCommentForm(e) {
    const newForm = document.createElement('form');
    newForm.classList.add('comments__form');

    const left = e.offsetX;
    const top = e.offsetY;

    newForm.style.cssText = `
        top: ${top}px;
        left: ${left}px;
        `;
    newForm.dataset.left = left;
    newForm.dataset.top = top;

    const newSpan = document.createElement('span');
    newSpan.classList.add('comments__marker');
    const newCheckbox = document.createElement('input');
    newCheckbox.classList.add('comments__marker-checkbox');
    newCheckbox.type = 'checkbox';
    newCheckbox.checked = true;
    newCheckbox.addEventListener('click', (event) => {
      this.showComForm();
      newCheckbox.checked = true;
    });
    const newComBody = document.createElement('div');
    newComBody.classList.add('comments__body');
    const newComment = document.createElement('div');
    newComment.classList.add('comment');
    const loader = document.createElement('div');
    loader.classList.add('loader');
    newComment.style.display = 'none';
    const newText = document.createElement('textarea');
    newText.classList.add('comments__input');
    newText.placeholder = 'Напишите ответ...';
    const closeBtn = document.createElement('input');
    closeBtn.classList.add('comments__close');
    closeBtn.type = 'button';
    closeBtn.value = 'Закрыть';
    closeBtn.addEventListener('click', (event) => {
      //проверять есть ли сообщения
      newCheckbox.checked = false;
      this.checkCom(newForm);
    })
    const sendBtn = document.createElement('input');
    sendBtn.classList.add('comments__submit');
    sendBtn.type = 'submit';
    sendBtn.value = 'Отправить';
    sendBtn.addEventListener('click', (event) => {
      event.preventDefault();
      this.sendCom(newText.value, newForm);
      newText.value = '';
    })

    newForm.appendChild(newSpan);
    newForm.appendChild(newCheckbox);
    newForm.appendChild(newComBody);
    newComBody.appendChild(newComment);
    newComment.appendChild(loader);
    for (let i = 0; i < 5; i++) {
      loader.appendChild(document.createElement('span'))
    }
    newComBody.appendChild(newText);
    newComBody.appendChild(closeBtn);
    newComBody.appendChild(sendBtn);


    this.comBox.appendChild(newForm);

    return newForm;
  }
  showComForm() {
    const forms = document.querySelectorAll('.comments__marker-checkbox');
    for (let form of forms) {
      this.checkCom(form.parentElement);
      form.checked = false;
    }
  }
  makeCanvas() {
    const ctx = document.createElement('canvas'),
          mask = document.createElement('img'),
          comBox = document.createElement('div');

    this.mask = mask;
    this.ctx = ctx;
    this.comBox = comBox;

    comBox.style.cssText = ctx.style.cssText = mask.style.cssText = `
        position: absolute;
        left: 50%;
        top:50%;
        transform: translate(-50%, -50%);
    `;

    mask.src = './pic/clearMask.png';

    this.editor.appendChild(mask);
    this.editor.appendChild(ctx);
    this.editor.appendChild(comBox);
  }
  refreshCanvas() {
    this.ctx.width = this.mask.width = this.image.offsetWidth;
    this.ctx.height = this.mask.height = this.image.offsetHeight;
    this.comBox.style.height = this.image.offsetHeight + 'px';
    this.comBox.style.width = this.image.offsetWidth + 'px';
  }
  drawing(color) {
    const canvas = this.ctx;
    const socket = this.socket;
    const sendMask = debounce(() => {
      canvas.toBlob(blob => socket.send(blob))
    }, 100)
    const ctx = canvas.getContext('2d');
    const w = ctx.width,
          h = ctx.height;
    const BRUSH_RADIUS = 4;
    let curves = [];
    let drawing = false;
    let weird = false;
    let needsRepaint = false;



    function circle(point) {
      ctx.beginPath();
      ctx.arc(...point, BRUSH_RADIUS / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = color;
    }

    function smoothCurveBetween (p1, p2) {
      const cp = p1.map((coord, idx) => (coord + p2[idx]) / 2);
      ctx.quadraticCurveTo(...p1, ...cp);
    }

    function smoothCurve(points) {
      ctx.beginPath();
      ctx.lineWidth = BRUSH_RADIUS;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      ctx.moveTo(...points[0]);

      for(let i = 1; i < points.length - 1; i++) {
        smoothCurveBetween(points[i], points[i + 1]);
      }

      ctx.stroke();
    }

    this.ctx.addEventListener("mousedown", (evt) => {
      drawing = this.isDrawing ? true : false;
      if (drawing) {
        const curve = [];
        curve.push([evt.offsetX, evt.offsetY]);
        curves.push(curve);
        needsRepaint = true;
      }
    });

    this.ctx.addEventListener("mouseup", (evt) => {
      drawing = false;
      sendMask();
    });

    this.ctx.addEventListener("mouseleave", (evt) => {
      drawing = false;
    });

    this.ctx.addEventListener("mousemove", (evt) => {
      if (drawing) {
        // add a point
        const point = [evt.offsetX, evt.offsetY]
        curves[curves.length - 1].push(point);
        needsRepaint = true;
      }
    });

    function repaint () {
      ctx.clearRect(0, 0, w, h);
      curves.forEach((curve) => {
        circle(curve[0]);
        smoothCurve(curve);
      });
    }

    function tick () {
      if(needsRepaint) {
        repaint();
        needsRepaint = false;
      }
      window.requestAnimationFrame(tick);
    }

    tick();
  }
  newComment(text, timestamp) {
    const comment = document.createElement('div');
    comment.classList.add('comment');

    const time = document.createElement('p');
    time.classList.add('comment__time');
    time.textContent = new Date(timestamp).toLocaleString('ru-Ru');

    const message = document.createElement('p');
    message.classList.add('comment__message');

    text.split('\n').forEach((el) => {
              if (!el) {
                  message.appendChild(document.createElement('br'));
              } else {
                  message.appendChild(document.createTextNode(el));
                  message.appendChild(document.createElement('br'));
              }
          })
    message.removeChild(message.lastElementChild);

    comment.appendChild(time);
    comment.appendChild(message);

    return comment;
  }
  sendPic(pic) {
    const post = new FormData();
    post.append('title', 'somePic')
    post.append('image', pic, 'somePic.jpg');

    /*fetch('https://neto-api.herokuapp.com/pic', {
      method: 'POST',
      body: post
      })
      .then((res) => {
        return res.json()
      })
      .then((res) => {
        this.imageInfo = res;
      })
      .catch((e) => {
        console.log('Error: ' + e)
      })*/

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://neto-api.herokuapp.com/pic');
      xhr.addEventListener("loadstart", () => {
        this.loader.style.display = 'block';
      })
      xhr.send(post);
      xhr.addEventListener("loadend", () => {
        this.loader.style.display = 'none';
      });
      xhr.addEventListener("load", () => {
        this.imageInfo = JSON.parse(xhr.responseText);
        sessionStorage.setItem('id', this.imageInfo.id);
        this.generateURL();
        this.showInnerEl({
          currentTarget: this.share
        })
        this.webSocket();
      });
      xhr.addEventListener('error', () => {
        console.log(xhr.responseText);
      })
  }
  sendCom(message, form) {
    const post = 'message=' + encodeURIComponent(message) +
    '&left=' + encodeURIComponent(form.dataset.left) + '&top=' + encodeURIComponent(form.dataset.top);
    console.log(post);

    /*fetch(`https://neto-api.herokuapp.com/pic/${this.imageInfo.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: post
    })
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      this.imageInfo = res;
      console.log(res);
    })
    .catch((e) => {
      console.log('Error: ' + e);
    })*/
    let loader = form.querySelectorAll('.comment');
    loader = loader[loader.length - 1];

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://neto-api.herokuapp.com/pic/${this.imageInfo.id}/comments`);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    xhr.addEventListener("loadstart", () => {
      loader.style.display = 'block';
    })
    xhr.send(post);
    /*xhr.addEventListener("loadend", () => {
      loader.style.display = 'none';
    });*/
    xhr.addEventListener("load", () => {
      const result = JSON.parse(xhr.responseText);
      this.imageInfo = result;
      /*const keys = Object.keys(result.comments)
      for (var i = 0; i < keys.length; i++) {
        if (result.comments[keys[i]].message === message) {
          form.setAttribute('id', keys[i])
        }
      }*/
    });
    xhr.addEventListener('error', () => {
      console.log(xhr.responseText);
    })
  }
  generateURL() {
    const regExp = /\?id=\S+/g;
    let url = window.location.toString();
    url = url.replace(regExp, '');
    this.menuUrl.value = url + '?id=' + this.imageInfo.id;
  }
  isNew() {
    const linkEx = /id=/g;
    const storage = sessionStorage.getItem('id');

    if(linkEx.test(window.location.href)) {
      let resultId  = window.location.search;
      resultId = resultId.replace('?id=', '');

      this.getImage(resultId);
    } else if (storage) {
      this.getImage(storage);
      if (sessionStorage.getItem('menuPosLeft')) {
        this.menu.style.left = sessionStorage.getItem('menuPosLeft');
        this.menu.style.top = sessionStorage.getItem('menuPosTop');
      }
    }
  }
  webSocket() {
    var socket = this.socket = new WebSocket(`wss://neto-api.herokuapp.com/pic/${this.imageInfo.id}`);
    socket.addEventListener('open', () => {
      console.log(`'WS's open`);
    })

    socket.addEventListener('message', (event) => {
      let answer = JSON.parse(event.data);
      if (answer.event === 'comment') {
        this.checkAndMake(answer.comment)
      } else if (answer.event === 'pic') {
        this.imageInfo = answer.pic;
      } else if (answer.event === 'mask') {
        this.mask.src = answer.url;
      } else if (answer.event === 'error') {
        console.log(answer.message)
      } else {
        console.log(answer)
      }
    })
    //событие еррор
    socket.addEventListener('error', () => {
      console.log(error.message)
    })
  }
  getImage(id) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `https://neto-api.herokuapp.com/pic/${id}`);
    xhr.addEventListener("loadstart", () => {
      this.loader.style.display = 'block';
    })
    xhr.send();
    xhr.addEventListener('loadend', () => {
      this.loader.style.display = 'none';
    })
    xhr.addEventListener("load", () => {
      this.imageInfo = JSON.parse(xhr.responseText);
      //картинка
      this.image.src = this.imageInfo.url;
      this.image.addEventListener('load', () => {
        this.refreshCanvas();
        if (this.imageInfo.comments) {
          const keys = Object.keys(this.imageInfo.comments)
          for (var i = 0; i < keys.length; i++) {
            this.checkAndMake(this.imageInfo.comments[keys[i]])
          }
          this.showComForm();
        }
      })
      //добавляем комментарии
      if(this.imageInfo.mask) {
        this.mask.src = this.imageInfo.mask;
      }
      this.refreshCanvas();
      this.webSocket();
      this.showInnerEl({
        currentTarget: this.commentsMode
      })
      this.generateURL();
      this.isComment = true;
    });
  }
  checkAndMake(comment) {
    const comments = Array.from(document.querySelectorAll('.comments__form'));
    const isShowCom = Array.from(this.menuToggle).find((el) => {
      return el.checked === true;
    })
    let result = comments.find(( el ) => {
      if ((el.dataset.left == comment.left) && (el.dataset.top == comment.top)) {
        return el;
      }
    })
    if (!result) {
      result = this.makeCommentForm({
        offsetX: comment.left,
        offsetY: comment.top
      })
      result.querySelector('.comments__marker-checkbox').checked = false;
    }
    if (isShowCom.value === 'off') {
      result.style.display = 'none';
    }
    result = result.querySelector('.comments__body');
    const newComment = this.newComment(comment.message, comment.timestamp);
    let loader = result.querySelectorAll('.comment');
    loader = loader[loader.length - 1];
    result.insertBefore(newComment, loader);
    loader.style.display = 'none';

  }
  checkCom(form) {
    if (form.querySelectorAll('.comment').length <= 1){
      form.remove();
    }
  }
}

new ImageEditor( document.querySelector('.wrap') );


function debounce(callback, delay = 0) {
  let timeout;
  return () => {
  	clearTimeout(timeout);
  	timeout = setTimeout(() => {
  		timeout = null;
  		callback();
  	}, delay);
  }
}

function throttle(callback) {
let isWaiting = false;
return function () {
if (!isWaiting) {
callback.apply(this, arguments);
isWaiting = true;
requestAnimationFrame(() => {
isWaiting = false;
});
}
}
}
