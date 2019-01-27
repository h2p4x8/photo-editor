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
    //this.comments = this.menu.querySelector('.comments')
    //this.draw
    this.registerEvents();
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
    });
    //кидать на сервер
    //this.sendImage();
  }
  showMenu ( isShow = true ) {
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
