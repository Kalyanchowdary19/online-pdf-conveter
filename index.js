
var data= [];
var width= 620;
var height= 800;
var pdfName;
var fileName= '';

const createPDF= document.getElementById('create-pdf');

encodeImageFileAsURL = (element) => {
    document.getElementById('input-page').style.display = 'none';
    document.getElementById('pdf-page').style.display = 'inline-block';

    const length = element.files.length;
    for (let i = 0; i < length; i++) {
        let file = element.files[i];
        let pdfname = element.files[0];
        if (file.size > 3 * 1024 * 1024) {
            alert('Please select images less than 3MB in size.');
            continue;
        }
        let reader = new FileReader();
        reader.readAsDataURL(file);

        let obj = {
            list: reader,
            fileName: file.name,
            time: new Date().toString() + i
        }

        reader.onloadend = () => {
            data = [...data, obj];
            pdfName = pdfname.name
        }
    }

    setTimeout(convertToPDF, 1000);
    document.getElementById('upload-msg').value = null;
    document.getElementById('upload-file').value = null;
    setTimeout(saveAsPDF, 1000);
}





handleDelete= (e)=>{
    data= data.filter((item)=>item.time!==e.currentTarget.id);
    if(data.length==0){
        location.reload();
    }
    else{
        convertToPDF();
    }
}


saveAsPDF = () => {
    const uploadMsg = document.getElementById('upload-msg');
    const convertBtn = document.getElementById('convertBtn');
    if (uploadMsg && convertBtn) {
        uploadMsg.style.display = 'none';
        convertBtn.style.display = 'inline-block';
    }

    if (data.length > 0) {
        setTimeout(embedImages, 1000);
    } else {
        
        alert('Please upload images before converting to PDF.');
    }
};

const displayRemainingAccuracy = (remainingAccuracy) => {
    alert(`Accuracy of the Image Resolution: ${remainingAccuracy.toFixed(2)}%`);
};

embedImages = async () => {
    if (data.length === 0) {
        return; 
    }

    let totalOriginalBytes = 0;
    let totalReducedBytes = 0;
    const pdfDoc = await PDFLib.PDFDocument.create();
    try {
        for (let i = 0; i < data.length; i++) {
            let imageBytes;
            if (data[i].fileName.toLowerCase().endsWith('.jpg') || data[i].fileName.toLowerCase().endsWith('.jpeg')) {
                imageBytes = await fetch(data[i].list.result).then(res => res.arrayBuffer());
            } else if (data[i].fileName.toLowerCase().endsWith('.png')) {
                imageBytes = await fetch(data[i].list.result).then(res => res.blob());
                // Convert blob to ArrayBuffer for PNG images
                imageBytes = await new Response(imageBytes).arrayBuffer();
            } else {
                console.error('Unsupported file format:', data[i].fileName);
                continue;
            }
            
            const originalSize = imageBytes.byteLength; // Correctly get the byte length
            totalOriginalBytes += originalSize;
            
            let embeddedImage;
            if (data[i].fileName.toLowerCase().endsWith('.jpg') || data[i].fileName.toLowerCase().endsWith('.jpeg')) {
                embeddedImage = await pdfDoc.embedJpg(imageBytes);
            } else if (data[i].fileName.toLowerCase().endsWith('.png')) {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
            } else {
                console.error('Unsupported file format:', data[i].fileName);
                continue;
            }
            
            const page = pdfDoc.addPage();
            
            const imageSize = embeddedImage.scale(1);
            page.setSize(imageSize.width, imageSize.height);
            
            const centerX = (imageSize.width - embeddedImage.width) / 2;
            const centerY = (imageSize.height - embeddedImage.height) / 2;

            page.drawRectangle({
                x: 0,
                y: 0,
                width: imageSize.width,
                height: imageSize.height,
                color: PDFLib.rgb(1, 1, 1), 
            });
            
            page.drawImage(embeddedImage, {
                x: centerX,
                y: centerY,
                width: embeddedImage.width,
                height: embeddedImage.height,
            });
            
            const pdfBytes = await pdfDoc.save();
            const reducedSize = pdfBytes.byteLength;
            totalReducedBytes += reducedSize;
        }

        const percentageChange = ((totalReducedBytes - totalOriginalBytes) / totalOriginalBytes) * 100;
        const remainingAccuracy = 100 - percentageChange;

        displayRemainingAccuracy(remainingAccuracy);

        const pdfBytes = await pdfDoc.save();

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(blob);
        downloadLink.download = pdfName.slice(0, -4) + '.pdf';

        document.body.appendChild(downloadLink);
        downloadLink.click();

        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(downloadLink.href);

        setTimeout(backToHomepage, 1000);
    } catch (error) {
        console.error('Error embedding image:', error);
    }
};





function convertToPDF(){
    createPDF.innerHTML= '';
    data.map((item,i)=>{
        const fileItem= document.createElement('div');
        fileItem.setAttribute('class','file-item');

        const modify= document.createElement('div');
        modify.setAttribute('class','modify');

        const button2= document.createElement('button');
        button2.setAttribute('class','delete-btn');
        button2.setAttribute('id',item.time);
        const remove= document.createElement('i');
        remove.setAttribute('class','fa fa-trash');
        button2.appendChild(remove);
        button2.addEventListener('click',(e)=>{
            handleDelete(e);
        });

        modify.appendChild(button2);

        fileItem.appendChild(modify);

        const imgContainer= document.createElement('div');
        imgContainer.setAttribute('class','img-container');
        const img= document.createElement('img');
        img.setAttribute('id','img');
        img.src= item.list.result;
        imgContainer.appendChild(img);
        fileItem.appendChild(imgContainer);

        const imgName= document
        .createElement('p');
        imgName.setAttribute('id','img-name');
        imgName.innerHTML= item.fileName;
        fileItem.appendChild(imgName);

        createPDF.appendChild(fileItem);

    });

    const addMoreFile= document.createElement('div');
    addMoreFile.setAttribute('class','add-more-file');

    const addFile= document.createElement('div');
    addFile.setAttribute('class','inp-cont');

    const input= document.createElement('input');
    input.setAttribute('id','inp');
    input.type= 'file';
    input.multiple= 'true';
    input.onchange= function(){
        encodeImageFileAsURL(this);
    }

    const p= document.createElement('p');
    const i= document.createElement('i');
    i.setAttribute('class','fa fa-plus');

    p.appendChild(i);

    const label= document.createElement('label');
    label.htmlFor= 'inp';
    label.innerHTML= 'Add Files';

    addFile.appendChild(p);
    addFile.appendChild(label);
    addFile.appendChild(input);
    
    addMoreFile.appendChild(addFile);

    createPDF.appendChild(addMoreFile);
}

function backToHomepage(){
    location.reload();
}

