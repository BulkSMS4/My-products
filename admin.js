function addProduct(){
  let item = {
    id: "p"+Date.now(),
    name: pname.value,
    price: pprice.value,
    currency: pcurrency.value,
    description: pdesc.value,
    payment_link: ppayment.value,
    images: pimages.value.split(",")
  };

  let list = JSON.parse(localStorage.getItem("zp_products") || "[]");
  list.push(item);
  localStorage.setItem("zp_products", JSON.stringify(list));
  alert("Product Added");
}

function previewPopup(){
  alert("Preview: " + adTitle.value + " - " + adMessage.value);
}

function savePopup(){
  let ad = {
    title: adTitle.value,
    message: adMessage.value,
    button: adBtnText.value,
    url: adBtnLink.value,
    color: adColor.value
  };

  let ads = JSON.parse(localStorage.getItem("zp_ads") || "[]");
  ads.push(ad);
  localStorage.setItem("zp_ads", JSON.stringify(ads));
  alert("Popup Saved");
}
