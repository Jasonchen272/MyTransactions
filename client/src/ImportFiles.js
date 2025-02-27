import React, {useState} from 'react';
import CheckBox from './components/CheckBox';
import NumberPicker from './components/NumberPicker';

function ImportFiles() {
    const [file, setFile] = useState()
    const [month, setMonth] = useState('january')
    const [bank, setBank] = useState('wells_fargo')
    const [fileTypeError, setFileTypeError] = useState(false)
    const [otherFormat, setOtherFormat] = useState({'skip': false, 'date': 0, 'description': 1, 'amount': 2, 'isCredit': false, 'paymentMessages': []})
    const [readingError, setReadingError] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
  
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
  
    function handleChange(event) {
      setFile(event.target.files[0])
      setFileTypeError(false)
    }
    function addNewTransaction() {
      let newTransaction = document.createElement('input')
      newTransaction.setAttribute('type', 'text')
      document.getElementById('CreditTransactions').appendChild(newTransaction)
    }
  
    function checkValidFormat() {
      const dateColumn = otherFormat.date;
      const descriptionColumn = otherFormat.description
      const amountColumn = otherFormat.amount;
  
      if (Number.isNaN(dateColumn) || Number.isNaN(descriptionColumn) || Number.isNaN(amountColumn)) {return false}
  
      return !((dateColumn === descriptionColumn) || (amountColumn === descriptionColumn) || (amountColumn === dateColumn))
    }
    
    function updatePaymentMessages() {
      const parent = document.getElementById("CreditTransactions");
      setOtherFormat(prevFormat => {
        return {...prevFormat, paymentMessages: [] }
      })
        parent.childNodes.forEach((n) => { 
          return (
          setOtherFormat(prevFormat => (n.value === '' ? prevFormat :{
          ...prevFormat, 
          paymentMessages: [...prevFormat.paymentMessages, n.value]
        })))
  
        })
    }
  
    const handleSubmit = async (event) =>{
      event.preventDefault()
      setIsUploading(true)
  
  
      if (!file) {
        setFileTypeError(true)
        setIsUploading(false)
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('month', month);
      formData.append('bank', bank);
      if (bank === "other") {
        if (!checkValidFormat()) { console.log("invalid format"); return; }
        formData.append('otherFormat', JSON.stringify(otherFormat));
      }
  
      try {
        await fetch("http://localhost:5000/files", {
          method: 'POST',
          body: formData,
        }).then(res=> {
          console.log(res)
          if (res.status === 400) {

          setReadingError(true)
          }
        })
        
      } catch (error) {
        setIsUploading(false)
      } finally {
        setIsUploading(false)
      }
      setOtherFormat({'skip': false, 'date': 0, 'description': 1, 'amount': 2, 'isCredit': false, 'paymentMessages': []})
    }

    const handleExport = async () => {
      setIsExporting(true)
      try {
        await fetch("http://localhost:5000/export", {
          method: "GET", 
        }).then(res => 
        res.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(
            new Blob([blob]),
          );
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute(
            'download',
            `MyBudget.xlsx`,
          );

          // Append to html link element page
          document.body.appendChild(link);

          // Start download
          link.click();

          // Clean up and remove the link
          link.parentNode.removeChild(link);
        }
        )
      } catch (e){
        console.log(e)
        console.log("Error")
      } finally {
        setIsExporting(false)
      }

    }
  
    return (
        <div>
        <div>Upload a CSV file and select bank and month</div>
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={handleChange}/>
      <select onChange={(e) => setMonth(e.target.value)}>
        {months.map(month => {
          return  (
            <option value={month.charAt(0).toLowerCase() + month.slice(1)} key={month}>{month}</option>
          )        
        })}
      </select>  
      <select onChange={(e) => setBank(e.target.value)}>
        <option value="wells_fargo">Wells Fargo</option>
        <option value="discover">Discover</option>
        <option value="capital_one">Capital One</option>
        <option value="other">Other</option>
      </select>  
      <button type="submit" disabled={isUploading}>{isUploading ? "Uploading..." : "Upload"}</button>
    </form>
    <button onClick={handleExport}>{isExporting ? "Downloading..." : "Download"}</button>
    <div style={{ display: bank === "other" ? "block" : "none" }}> 
      Please input the format of your file
      <CheckBox 
          switchBool={() => setOtherFormat(prevFormat => ({
            ...prevFormat, 
            skip: !prevFormat.skip
          }))}
          text = "Skip First Line?" />
        <CheckBox 
          switchBool={() => setOtherFormat(prevFormat => ({
            ...prevFormat, 
            isCredit: !prevFormat.isCredit
          }))}
          text = "is Credit?" />
      Count the columns starting from 0

      <div style={{display: "flex"}}>
      <NumberPicker 
      text="Date column"
      defaultValue={0}
      onChange={ (e) =>
        setOtherFormat(prevFormat => ({
         ...prevFormat, 
          date: parseInt(e.target.value)
        }))
        } />

    <NumberPicker 
      text="Description column"
      defaultValue={1}
      onChange={ (e) =>
        setOtherFormat(prevFormat => ({
         ...prevFormat, 
          description: parseInt(e.target.value)
        }))
        } />
        <NumberPicker 
      text="Amount column"
      defaultValue={2}
      onChange={ (e) =>
        setOtherFormat(prevFormat => ({
         ...prevFormat, 
          amount: parseInt(e.target.value)
        }))
        } />

      </div>
      <div>
        <p>
          Enter any description that are credit payments (Ex. DISCOVER E-PAYMENT)
        </p>
        <button onClick={() => updatePaymentMessages() }>Save</button>
        <button onClick={addNewTransaction}>+</button>
        <div id = "CreditTransactions" style={{display: "grid", width:'50vh'}}></div>
      </div>
    </div>
    
    <div style={{ display: fileTypeError ? "block" : "none" }}>Wrong file type or name</div>
    <div style={{ display: readingError ? "block" : "none" }}>Failed to read file try redoing the format</div>
</div>

    )
}

export default ImportFiles