// Tiện ích DOM: ui(id) lấy phần tử giao diện.

export let ui;

export function buildDom(){
ui=id=>document.getElementById(id);
}
