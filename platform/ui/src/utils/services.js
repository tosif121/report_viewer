import axios from 'axios';

const BASE_URL = 'http://dev.iotcom.io:5500/';
// const BASE_URL = 'https://volente.iotcom.io:8080/';
// const BASE_URL = 'http://pacc.iotcom.io:5500/';
//const BASE_URL = 'http://localhost:5500/';
// const BASE_URL = 'http://rad.iotcom.io:5500/';

export const getDataFromServer = async ({
  end_point,
  params,
  call_back,
  props,
}) => {
  try {
    const url = BASE_URL + end_point;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${params?.token}` },
    });
    const object = {
      response: response.data,
      status: 'success',
      error: undefined,
      props,
    };
    call_back(object);
  } catch (error) {
    const object = {
      response: undefined,
      status: 'error',
      error,
      props,
    };
    call_back(object);
  }
};

export const postDatatoServer = ({ end_point, body, call_back, props }) => {
  const header = props?.header
    ? { headers: { Authorization: `Bearer ${props?.token}` } }
    : null;
  const url = BASE_URL + end_point;
  axios
    .post(url, body, header)
    .then(response => {
      const object = {
        response: response.data,
        status: 'success',
        error: undefined,
        props,
      };
      call_back(object);
    })
    .catch(error => {
      const object = {
        response: undefined,
        status: 'error',
        error,
        props,
      };
      call_back(object);
    });
};

export const uploadImageToServer = async ({ end_point, data, props }) => {
  try {
    const url = BASE_URL + end_point;
    const formData = new FormData();
    formData.append(
      'file',
      data,
      `.${data.name.split('.')[data.name.split('.').length - 1]}`
    );

    const response = await axios.post(url, formData);
    const object = {
      response: response.data,
      status: 'success',
      error: undefined,
      props,
    };
    return object;
  } catch (error) {
    console.log(error);
  }
};

export const downloadFileServer = async ({ end_point, props }) => {
  try {
    const url = BASE_URL + end_point;
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const fileBlob = new Blob([response.data], { type: 'application/msword' });
    const fileUrl = window.URL.createObjectURL(fileBlob);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', props);
    document.body.appendChild(link);
    link.click();
    //call_back(true);
  } catch (error) {
    console.log(error);
    //call_back(false);
  }
};
