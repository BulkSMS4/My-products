window.onload = ()=>{
  let ads = JSON.parse(localStorage.getItem("zp_ads") || "[]");
  if(ads.length){
    let ad = ads[ads.length-1];
    alert(ad.title + "

" + ad.message);
  }
};
