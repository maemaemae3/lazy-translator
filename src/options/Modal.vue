<template>
  <transition name="modal" appear>
    <div class="modal modal-overlay" @click.self="$emit('close')">
      <div class="modal-window">
        <div class="modal-content">
          <slot></slot>
        </div>
        <footer class="modal-footer">
          <slot name="footer">
            <button @click="$emit('close')">Cancel</button>
            <button @click="$emit('delete')">Delete</button>
          </slot>
        </footer>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
$dic: #5b92b7;
$back: #eee;

.modal {
  &.modal-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    z-index: 30;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
  }

  &-window {
    background: $back;
    border-radius: 4px;
    overflow: hidden;
  }

  &-content {
    text-align: center;
    padding: 10px 16px 0px 16px;
  }

  &-footer {
    background: $back;
    padding: 10px;
    text-align: center;
  }
}

.modal {
  &-enter-active, &-leave-active {
    transition: opacity 0.2s;
  }
  &-leave-active {
    transition: opacity 0.2s;
  }
  &-enter, &-leave-to {
    opacity: 0;
    .modal-window {
      transition: opacity 0.2s, transform 0.2s;
      opacity: 0;
      transform: translateY(-20px);
    }
  }
}

button {
  color: $dic;
  border: 1px solid $dic;
  font-size: inherit;
  background-color: white;
  display: inline-block;
  text-align: left;
  text-decoration: none;
  margin: 2px 5px;
  padding: 2px 16px 2px 16px;
  border-radius: 3px;
  transition: .2s;
  &:hover {
    background-color: $dic;
    border-color: $dic;
    color: white;
  }
}
</style>
