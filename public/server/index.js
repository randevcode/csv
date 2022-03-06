const reader = new FileReader();

const upload = document.getElementById('btn_upload');

upload.onclick = () => {
  const picker = document.getElementById('input_file');

  picker.onchange = () => {
    const files = Array.from(picker.files);

    reader.readAsText(files[0]);

    reader.onload = (e) => {};
  };
};
