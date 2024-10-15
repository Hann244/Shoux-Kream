import { addImageToS3 } from "/js/aws-s3.js";
import * as Api from "/js/api.js";
import { checkLogin, randomId, createNavbar } from "/js/useful-functions.js";

// 요소(element)들과 상수들
const titleInput = document.querySelector("#titleInput");
const manufacturerInput = document.querySelector("#manufacturerInput");
const shortDescriptionInput = document.querySelector("#shortDescriptionInput");
const detailDescriptionInput = document.querySelector("#detailDescriptionInput");
const imageInput = document.querySelector("#imageInput");
const inventoryInput = document.querySelector("#inventoryInput");
const priceInput = document.querySelector("#priceInput");
const searchKeywordInput = document.querySelector("#searchKeywordInput");
const addKeywordButton = document.querySelector("#addKeywordButton");
const keywordsContainer = document.querySelector("#keywordContainer");
const editButton = document.querySelector("#editButton");
const editItemForm = document.querySelector("#editItemForm");
const fileNameSpan = document.querySelector("#fileNameSpan");

// 현재 수정할 아이템 ID
const itemId = window.location.pathname.split("/").pop();

// 로그인 확인, 네비게이션 및 초기 데이터 로드
checkLogin();
addAllElements();
addAllEvents();
loadItemData(); // 아이템 데이터 로드

// HTML에 요소를 추가하는 함수들을 묶어주어서 코드를 깔끔하게 하는 역할임.
function addAllElements() {
  createNavbar();
}

// addEventListener들을 묶어주어서 코드를 깔끔하게 하는 역할임.
function addAllEvents() {
  imageInput.addEventListener("change", handleImageUpload);
  editButton.addEventListener("click", handleEditSubmit);
  addKeywordButton.addEventListener("click", handleKeywordAdd);
}

// 기존 아이템 데이터를 로드하여 필드에 표시
async function loadItemData() {
  try {
    const itemData = await Api.get(`/item/${itemId}`);

    titleInput.value = itemData.title;
    manufacturerInput.value = itemData.manufacturer;
    shortDescriptionInput.value = itemData.shortDescription;
    detailDescriptionInput.value = itemData.detailDescription;
    inventoryInput.value = itemData.inventory;
    priceInput.value = itemData.price;
    fileNameSpan.innerText = `현재 사진: ${itemData.imageKey}`;

    // 기존 검색 키워드 로드
    itemData.searchKeywords.forEach(keyword => {
      addKeywordToContainer(keyword);
      searchKeywords.push(keyword); // 배열에 추가
    });
  } catch (error) {
    console.error("데이터 로드 오류:", error);
    alert("상품 정보를 불러오는 중 오류가 발생했습니다.");
  }
}

// 제품 수정 - 사진은 AWS S3에 저장, 이후 제품 정보를 백엔드 DB에 저장.
async function handleEditSubmit(e) {
  e.preventDefault();

  const title = titleInput.value;
  const manufacturer = manufacturerInput.value;
  const shortDescription = shortDescriptionInput.value;
  const detailDescription = detailDescriptionInput.value;
  const image = imageInput.files[0];
  const inventory = parseInt(inventoryInput.value);
  const price = parseInt(priceInput.value);

  // 입력 칸이 비어 있으면 진행 불가
  if (!title || !manufacturer || !shortDescription || !detailDescription || !inventory || !price) {
    return alert("빈 칸 및 0이 없어야 합니다.");
  }

  if (image && image.size > 3e6) {
    return alert("사진은 최대 2.5MB 크기까지 가능합니다.");
  }

  try {
    console.log("이미지 및 데이터 업데이트 시작...");

    // FormData 생성 및 데이터 추가
    const formData = new FormData();
    formData.append("title", title);
    formData.append("manufacturer", manufacturer);
    formData.append("shortDescription", shortDescription);
    formData.append("detailDescription", detailDescription);
    if (image) {
      formData.append("imageKey", image); // 파일 추가
    }
    formData.append("inventory", inventory);
    formData.append("price", price);

    // 검색 키워드를 문자열로 결합하여 추가
    formData.append("searchKeywords", searchKeywords.join(","));

    // FormData 전송 - 수정 API 호출
    await fetch(`/item/${itemId}`, {
      method: "PUT",
      body: formData,
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`
      }
    });

    alert(`정상적으로 ${title} 제품이 수정되었습니다.`);
    window.location.href = `/item/item-detail/${itemId}`; // 수정 후 상세 페이지로 이동
  } catch (err) {
    console.log("수정 오류:", err.stack);
    alert(`문제가 발생하였습니다. 확인 후 다시 시도해 주세요: ${err.message}`);
  }
}

// 사용자가 사진을 업로드했을 때, 파일 이름이 화면에 나타나도록 함.
function handleImageUpload() {
  const file = imageInput.files[0];
  if (file) {
    fileNameSpan.innerText = file.name;
  } else {
    fileNameSpan.innerText = "";
  }
}

// 검색 키워드를 추가할 때 사용되는 함수
let searchKeywords = [];
function handleKeywordAdd(e) {
  e.preventDefault();

  const newKeyword = searchKeywordInput.value;

  if (!newKeyword) {
    return;
  }

  if (searchKeywords.includes(newKeyword)) {
    return alert("이미 추가한 검색어입니다.");
  }

  addKeywordToContainer(newKeyword);
  searchKeywords.push(newKeyword);

  searchKeywordInput.value = "";
  searchKeywordInput.focus();
}

// 키워드를 화면에 추가하고 삭제 기능을 추가하는 함수
function addKeywordToContainer(keyword) {
  const random = randomId();

  keywordsContainer.insertAdjacentHTML(
    "beforeend",
    `
    <div class="control" id="a${random}">
      <div class="tags has-addons">
        <span class="tag is-link is-light">${keyword}</span>
        <a class="tag is-link is-light is-delete"></a>
      </div>
    </div>
  `
  );

  keywordsContainer
    .querySelector(`#a${random} .is-delete`)
    .addEventListener("click", handleKeywordDelete);
}

// 키워드 삭제 처리 함수
function handleKeywordDelete(e) {
  const keywordToDelete = e.target.previousElementSibling.innerText;

  const index = searchKeywords.indexOf(keywordToDelete);
  searchKeywords.splice(index, 1);

  e.target.parentElement.parentElement.remove();
}


//console.log("JavaScript 로드 성공");
//// 요소들 가져오기
//const titleInput = document.querySelector("#titleInput");
//const manufacturerInput = document.querySelector("#manufacturerInput");
//const shortDescriptionInput = document.querySelector("#shortDescriptionInput");
//const detailDescriptionInput = document.querySelector("#detailDescriptionInput");
//const imageInput = document.querySelector("#imageInput");
//const inventoryInput = document.querySelector("#inventoryInput");
//const priceInput = document.querySelector("#priceInput");
//const searchKeywordInput = document.querySelector("#searchKeywordInput");
//const addKeywordButton = document.querySelector("#addKeywordButton");
//const keywordsContainer = document.querySelector("#keywordContainer");
//const submitButton = document.querySelector("#submitButton");
//const registerItemForm = document.querySelector("#registerItemForm");
//const fileNameSpan = document.querySelector("#fileNameSpan");
//
//// 검색 키워드를 저장할 배열
//let searchKeywords = [];
//
//// 이벤트 리스너 등록
//imageInput.addEventListener("change", handleImageUpload);
//addKeywordButton.addEventListener("click", handleKeywordAdd);
//submitButton.addEventListener("click", handleSubmit);
//
//// 파일 업로드 시 파일 이름 표시
//function handleImageUpload() {
//    const file = imageInput.files[0];
//    fileNameSpan.textContent = file ? file.name : "사진 파일 (png, jpg, jpeg)";
//}
//
//// 검색 키워드 추가
//function handleKeywordAdd() {
//    const newKeyword = searchKeywordInput.value.trim();
//    if (newKeyword && !searchKeywords.includes(newKeyword)) {
//        searchKeywords.push(newKeyword);
//        const keywordElement = document.createElement("span");
//        keywordElement.textContent = newKeyword;
//        keywordElement.classList.add("tag");
//        keywordsContainer.appendChild(keywordElement);
//        searchKeywordInput.value = "";
//    }
//}
//
//// 폼 제출
//async function handleSubmit() {
//  // 서버로 보낼 데이터를 준비합니다.
//  const data = {
//    title: titleInput.value,
//    manufacturer: manufacturerInput.value,
//    shortDescription: shortDescriptionInput.value,
//    detailDescription: detailDescriptionInput.value,
//    imageKey: imageInput.value,
//    inventory: inventoryInput.value,
//    price: priceInput.value,
//    searchKeywords,
//  };
//
//  try {
//    const response = await fetch("/item/item-add", {
//      method: "POST",
//      headers: {
//        "Content-Type": "application/json",
//      },
//      body: JSON.stringify(data),
//    });
//
//    if (response.ok) {
//      alert("상품이 성공적으로 등록되었습니다.");
//      window.location.href = "/item/item-list";
//    } else {
//      alert("상품 등록에 실패했습니다.");
//    }
//  } catch (error) {
//    console.error("Error:", error);
//    alert("오류가 발생했습니다.");
//  }
//}