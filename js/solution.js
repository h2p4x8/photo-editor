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
      shiftY: 0
    }
    this.modeButtons = this.menu.querySelectorAll('.mode');
    this.image = this.editor.querySelector('.current-image');
    this.downloadNew = this.menu.querySelector('.new');
    this.burgerButton = this.menu.querySelector('.burger');
    this.menuToggle = this.menu.querySelectorAll('.menu__toggle');
    this.commentForm = this.editor.querySelector('.comments__form');
    //this.comments = this.menu.querySelector('.comments')
    this.draw = this.menu.querySelector('.draw');
    this.isDrawing = false;
    this.drawTools = this.menu.querySelectorAll('.menu__color');
    this.registerEvents();
    this.makeCanvas();
  }

  registerEvents() {
    this.menu.addEventListener('mousedown', event => this.dragStart(event));
    this.menu.addEventListener('mousemove', event => this.dragObj(event));
    this.menu.addEventListener('mouseup', () => {
      if ( this.dragTools.movedPiece ) {
        this.dragTools.movedPiece = null;
      }
    });
    this.downloadNew.addEventListener('change', event => this.loadImage(event))
    this.editor.addEventListener('dragover', event => event.preventDefault())
    this.editor.addEventListener('drop', ( event ) => {
      event.preventDefault();
      if (this.image.src) {
        this.showError(true, false);
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
    });
    this.menuToggle.forEach((el) => {
      el.addEventListener('change', ()=>{
        if (el.checked) {
          this.showComments(el.value)
        }
        return;
      })
    })
    this.editor.addEventListener('click', (event)=>{
      if (event.target !== this.menu  && this.editor.querySelector('#comments-on').checked && !this.isDrawing) {
        this.makeCommentForm(event, event.pageXt, event.pageY);
      }
      return;
    })
    this.draw.addEventListener('click', () => {
      this.isDrawing = true;
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
  }
  showError(isShow = true, isWrongType = true) {
    this.errorMessage.textContent = isWrongType ? 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.' : 'Чтобы загрузить новое изображение, пожалуйста воспользуйтесь пунктом "Загрузить новое" в меню.'
    this.errorContainer.style.display = isShow ? 'block' : 'none';
  }
  dragStart( e ) {
    if (e.target === this.drag) {
      this.dragTools.movedPiece = this.menu;
      const bounds = e.target.getBoundingClientRect();
      this.dragTools.shiftX = e.pageX - bounds.left - window.pageXOffset;
      this.dragTools.shiftY = e.pageY - bounds.top - window.pageYOffset;
    }
  }
  dragObj( e ) {
    if ( this.dragTools.movedPiece ) {
      // Предотвращаем выделение текста
      e.preventDefault();
      let x = e.pageX - this.dragTools.shiftX,
          y = e.pageY - this.dragTools.shiftY;
      this.dragTools.movedPiece.style.left = x + 'px';
      this.dragTools.movedPiece.style.top = y + 'px';
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

    this.image.src = URL.createObjectURL(img);
    this.image.addEventListener('load', event => {
      URL.revokeObjectURL(event.target.src);
      this.refreshCanvas();
    });
    //кидать на сервер
    //this.sendImage();

  }
  showMenu () {
    this.isDrawing = false;
    this.burgerButton.style.display = 'none';
    this.modeButtons.forEach( (el) => {
      el.style.display = 'inline-block';
      el.nextElementSibling.style.display = 'none';
    })
  }
  showInnerEl( e ) {
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
    } else {
      comments.forEach(el => el.style.display = 'block')
    }
  }
  makeCommentForm(e) {
    this.showComForm();

    const newForm = document.createElement('form');
    newForm.classList.add('comments__form');
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
    closeBtn.addEventListener('click', () => {
      //проверять есть ли сообщения
      newCheckbox.checked = false;
    })
    const sendBtn = document.createElement('input');
    sendBtn.classList.add('comments__submit');
    sendBtn.type = 'submit';
    sendBtn.value = 'Отправить';

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

    //откуда?
    let x = e.pageX - 20,
        y = e.pageY - 2;

    newForm.style.left = x + 'px';
    newForm.style.top = y + 'px';
    this.editor.appendChild(newForm);
  }
  showComForm() {
    const forms = document.querySelectorAll('.comments__marker-checkbox');
    for (let form of forms) {
      form.checked = false;
    }
  }
  makeCanvas() {
    const ctx = document.createElement('canvas');
    this.ctx = ctx;
    ctx.style.position = 'absolute';
    this.editor.appendChild(ctx);
  }
  refreshCanvas() {
    const bounds = this.image.getBoundingClientRect();
    this.ctx.style.top = bounds.top + 'px';
    this.ctx.style.left = bounds.left + 'px';
    this.ctx.width = this.image.offsetWidth;
    this.ctx.height = this.image.offsetHeight;
  }
  drawing(color) {
    const ctx = this.ctx.getContext('2d');
    const w = ctx.width,
          h = ctx.height;
    const BRUSH_RADIUS = 4;
    let curves = [];
    let drawing = false;
    let weird = false;
    let needsRepaint = false;

    function circle(point) {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(...point, BRUSH_RADIUS / 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    function smoothCurveBetween (p1, p2) {
      const cp = p1.map((coord, idx) => (coord + p2[idx]) / 2);
      ctx.quadraticCurveTo(...p1, ...cp);
    }

    function smoothCurve(points) {
      ctx.beginPath();
      ctx.lineWidth = BRUSH_RADIUS;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

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
}

new ImageEditor( document.querySelector('.wrap') );

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
