const videoEnabled = true;

const name = "[Hamamoto Kazuma]";
document.getElementById("title").innerHTML = `${name}'s Faces App`;

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then(function(stream) {
    //ページ上で再生
    const player = document.getElementById("player");
    player.srcObject = stream;
  })
  .catch(function(error) {
    console.error("video initialize error", error);
  });

$(function() {
  //撮影ボタンを押したら静止画を撮影して、映像の隣に静止画が表示されるようにする
  const captureButton = document.getElementById("captureButton");
  captureButton.addEventListener("click", function() {
    const snapshot = document.getElementById("snapshot");
    const context = snapshot.getContext("2d");
    //スナップショットの表示
    context.drawImage(player, 0, 0, snapshot.width, snapshot.height);
    faceApi(snapshot.toDataURL("image/jpg"));
  });
});

//撮影した静止画を使って解析APIを呼び出す
const faceApi = function(sourceImage) {
  //FaceApi呼び出し
  $.ajax({
    url: uriBase + "?" + $.param(params),
    beforeSend: function(xhrObj) {
      xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
    },
    type: "POST",
    data: makeblob(sourceImage),
    processData: false
  })
    .done(function(data) {
      // API呼び出し結果 画面表示
      //textAreaという変数を作って、結果を表示したいHTML側の枠の要素（Id）を設定する
      const textArea = document.getElementById("responseTextArea");
      textArea.innerText = JSON.stringify(data);
      // 枠線表示
      drawFaceline(data);
    })
    .fail(function(error) {
      alert("error");
      console.error(error);
    });
};

const drawFaceline = function(data) {
  data.forEach(function(element, index) {
    //顔の位置座標を設定
    const faceEmotion = element.faceAttributes.emotion;
    const faceRe = element.faceRectangle;
    //faceReに格納されている顔の位置情報を、それぞれleft,top,width,heightという変数を作ってそこに設定する。
    const left = faceRe.left;
    const right = faceRe.right;
    const top = faceRe.top;
    const width = faceRe.width;
    const maxEmotionalKey = Object.keys(faceEmotion).sort(
      (a, b) => faceEmotion[b] - faceEmotion[a]
    )[0];
    const height = faceRe.height;
    var value = 0.0;
    Object.keys(faceEmotion).forEach(function(key) {
      value = Math.max(value, faceEmotion[key]);
    });

    //変数"canvas"を作り、顔枠を出したい静止画の要素を取得して設定する
    const canvas = document.getElementById("snapshot");
    const ctx = canvas.getContext("2d");
    //枠線の色や太さの設定
    ctx.lineWidth = 2;
    //枠線の色を設定する（RGB方式）
    ctx.strokeStyle = "rgb(255,0,0)";

    ctx.strokeRect(left, top, width, height);

    // 番号を表示
    //枠線の上に表示する数字の色を設定する（RGB方式）
    ctx.fillStyle = "rgb(0,0,255)";
    ctx.font = "bold 32px 'Arial'";
    ctx.fillText(maxEmotionalKey + faceEmotion[maxEmotionalKey], left, top);
  });
};

//引数の画像をBase64に変換
const makeblob = function(dataURL) {
  const BASE64_MARKER = ";base64,";
  if (dataURL.indexOf(BASE64_MARKER) == -1) {
    const parts = dataURL.split(",");
    const contentType = parts[0].split(":")[1];
    const raw = decodeURIComponent(parts[1]);
    return new Blob([raw], { type: contentType });
  }
  const parts = dataURL.split(BASE64_MARKER);
  const contentType = parts[0].split(":")[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;

  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

// ビデオから映像取得
if (videoEnabled) {
  // 画像
  document.getElementById("player").remove();
  document.querySelector("input#image").remove();
  document.getElementById("captureButton").innerHTML = "撮影する";
  document.getElementById("player-wrapper").innerHTML =
    '<video id="player" autoplay style="height: 96%; width: 100%"></video>';
}

// APIのKeyなどの設定
const subscriptionKey = "d21b0f6274c94a06aa5a0e8a96a61710";
const uriBase =
  "https://australiaeast.api.cognitive.microsoft.com/face/v1.0/detect";
const params = {
  returnFaceId: "true",
  returnFaceLandmarks: "false",
  returnFaceAttributes:
    "age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure,noise"
};
