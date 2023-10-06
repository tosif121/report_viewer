import React, { useEffect, useState } from 'react';
import ReactSelect from 'react-select';
import jsPDF from 'jspdf';
import axios from 'axios';
import moment from 'moment';
import { getDataFromServer, postDatatoServer } from '../utils/services';
import autoTable from 'jspdf-autotable';

const TextEditor: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [reports, setReports] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [getUploadImages, setGetUploadImages] = useState([]);

  const url = window.location.href;
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const studyInstanceUIDs = urlParams.get('StudyInstanceUIDs');

  useEffect(() => {
    function handleResponse(responseData) {
      if (responseData.status === 'success') {
        setReports(responseData.response);
      }
    }

    const endpoint = 'templates';
    const params = {
      token: '',
    };
    const props = {};

    getDataFromServer({
      end_point: endpoint,
      params,
      call_back: handleResponse,
      props,
    });
  }, []);

  useEffect(() => {
    function handleResponse(responseData) {
      if (responseData.status === 'success') {
        setTableData(responseData.response[0]);
      } else {
        console.error('Error:', responseData.error);
      }
    }
    const endpoint = 'StudyID';
    const requestBody = {
      StudyInstanceUID: studyInstanceUIDs,
    };
    const props = {
      header: true,
    };

    postDatatoServer({
      end_point: endpoint,
      body: requestBody,
      call_back: handleResponse,
      props,
    });
  }, []);

  useEffect(() => {
    if (selectedItem) {
      const selectedReport = reports.find(
        report => `${report.name}-${report.templateID}` === selectedItem.value
      );
      if (selectedReport) {
        const initialText = `
          ${selectedReport.name}

         OBSERVATION:
            ${selectedReport.content.OBSERVATION}

         IMPRESSION:
            ${selectedReport.content.IMPRESSION}
        `;
        setText(initialText);
      }
    } else {
      setText('');
    }
  }, [selectedItem, reports]);

  useEffect(() => {
    setPreviewText(text);
  }, [text]);

  const handleSave = async () => {
    if (text && selectedItem) {
      const doc = new jsPDF();
      // Add the table data to the PDF
      doc.setFontSize(12);
      const table = [
        ['Patient ID', 'Patient Name', 'Date', 'Location', 'Ref Doctor'],
        [
          tableData.patientID,
          tableData.name,
          formattedDate,
          tableData.location,
          tableData.ReferringPhysicianName,
        ],
      ];

      const tableStyles = {
        tableWidth: 'auto',
        theme: 'grid',
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: 0,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: 0,
          halign: 'center',
        },
      };

      autoTable(doc, { body: table }, tableStyles);

      const lines = text.split('\n');

      const lineHeight = 10;
      let yPos = 50;

      lines.forEach(line => {
        doc.text(10, yPos, line);
        yPos += lineHeight;

        if (yPos + lineHeight > doc.internal.pageSize.height) {
          doc.addPage();
          yPos = 10;
        }
      });

      const reportName = selectedItem.label.replace(/ /g, '_');
      const pdfFileName = `${reportName}.pdf`;
      const formData = new FormData();
      const blob = doc.output('blob');

      formData.append('file', blob, pdfFileName);

      const endPoint = 'http://dev.iotcom.io:5500/upload/report';

      try {
        const responseImage = await axios.post(`${endPoint}/?id=${tableData.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (responseImage.data.success) {
          console.log('File uploaded successfully');
        } else {
          console.error('File upload failed');
        }
      } catch (error) {
        console.error('Error during file upload:', error);
      }

      doc.save(pdfFileName);
    } else {
      console.warn('Cannot generate PDF without text or selected report');
    }
  };

  const handleView = () => {
    if (selectedItem) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const reportOptions = reports.map(report => ({
    value: `${report.name}-${report.templateID}`,
    label: report.name,
  }));

  const handleDropdownChange = (
    selectedOption: {
      value: string;
      label: string;
    } | null
  ) => {
    setSelectedItem(selectedOption);
  };

  const formattedDate = moment(tableData.Date, 'D/M/YYYY, h:mm:ss a').format('DD-MMMM-YYYY');

  return (
    <div className="p-1">
      <table className="mb-3 min-w-full border text-center text-sm font-light text-white">
        <thead className="border-b font-medium">
          <tr>
            <th
              scope="col"
              className="border-r"
            >
              Patient ID
            </th>
            <th
              scope="col"
              className="border-r"
            >
              Patient Name
            </th>
            <th
              scope="col"
              className="border-r"
            >
              Date
            </th>
            <th
              scope="col"
              className="border-r"
            >
              Location
            </th>
            <th
              scope="col"
              className="border-r"
            >
              Ref Doctor
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b font-medium">
            <td className="border-r">{tableData.patientID}</td>
            <td className="border-r">{tableData.name}</td>
            <td className="border-r">{formattedDate}</td>
            <td className="border-r">{tableData.location}</td>
            <td className="border-r">{tableData.ReferringPhysicianName}</td>
          </tr>
        </tbody>
      </table>
      <ReactSelect
        value={selectedItem}
        onChange={selectedOption => handleDropdownChange(selectedOption)}
        options={reportOptions}
        placeholder="Select a report"
        isSearchable={true}
      />

      <p className="mb-2 text-blue-500">
        Selected Report: {selectedItem ? selectedItem.label : ''}
      </p>

      <textarea
        contentEditable={!selectedItem ? false : true}
        className={`${
          selectedItem
            ? 'text-primary-dark mb-2 w-full rounded border-2 p-2 focus:border-blue-500 focus:outline-none'
            : 'mr-6 w-full rounded bg-gray-300 px-4 py-2 text-white'
        }`}
        style={{ minHeight: '65vh', whiteSpace: 'pre-line' }}
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={!selectedItem}
      ></textarea>

      <div className="mt-1 flex">
        <button
          onClick={handleView}
          className={`${
            text ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300'
          } mr-6 w-full rounded px-4 py-2 text-white`}
          disabled={!text}
        >
          View
        </button>
        <button
          disabled={!text || !selectedItem}
          onClick={handleSave}
          className={`${
            text ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300'
          } mr-6 w-full rounded px-4 py-2 text-white`}
        >
          Save
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="overflow-auto rounded bg-white p-4">
            <h2 className="mb-2 text-lg font-semibold">Preview:</h2>
            <table className="text-dark mb-3 min-w-full border text-center text-sm font-light">
              <thead className="border-b font-medium">
                <tr>
                  <th
                    scope="col"
                    className="border-r"
                  >
                    Patient ID
                  </th>
                  <th
                    scope="col"
                    className="border-r"
                  >
                    Patient Name
                  </th>
                  <th
                    scope="col"
                    className="border-r"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="border-r"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="border-r"
                  >
                    Ref Doctor
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b font-medium">
                  <td className="border-r">{tableData.patientID}</td>
                  <td className="border-r">{tableData.name}</td>
                  <td className="border-r">{formattedDate}</td>
                  <td className="border-r">{tableData.location}</td>
                  <td className="border-r">{tableData.ReferringPhysicianName}</td>
                </tr>
              </tbody>
            </table>

            <div
              className="overflow-y-auto whitespace-pre-line rounded border-2 p-2 focus:border-blue-500 focus:outline-none"
              dangerouslySetInnerHTML={{
                __html: previewText || 'No preview available',
              }}
              style={{
                width: '1000px',
                maxHeight: '500px',
              }}
            />
            <button
              onClick={handleCloseModal}
              className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextEditor;
