import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  View, Text, ViewPropTypes, ScrollView, Alert,
} from 'react-native';
import md5 from 'md5';
import QRCode from 'react-native-qrcode-svg';

class QrDataTransferSender extends PureComponent {
  constructor(props) {
    super(props);

    this.speedArray = [0, 500, 350, 200];
    this.speedIndex = 1;
    this.scrollX = 0;
    this.indexScrollWidth = 100;

    const { data, maxSize } = props;
    const dataArray = this._createDataArray({ data, maxSize });
    const checkSum = md5(`${data}`).toUpperCase();

    this.state = {
      dataArray,
      checkSum,
      index: 0,
    };
  }

  componentDidMount() {
    this._startNextIndexTimer();
  }

  componentWillReceiveProps(nextProps) {
    const { data, maxSize } = nextProps;
    const dataArray = this._createDataArray({ data, maxSize });
    const checkSum = md5(`${data}`).toUpperCase();

    this.setState({
      dataArray,
      checkSum,
      index: 0,
    });
  }

  componentWillUnmount() {
    this._stopNextIndexTimer();
  }

  _stopNextIndexTimer = () => {
    clearTimeout(this.indexTimer);
    clearTimeout(this.timeoutBegin);
  }

  _createDataArray = ({ data, maxSize }) => {
    const chunks = Math.ceil(data.length / maxSize);
    const chunkSize = Math.ceil(data.length / chunks);

    const regExp = new RegExp(`.{1,${chunkSize}}`, 'g');
    const dataArray = data.match(regExp);

    return dataArray;
  }

  _createDataString = ({ dataArray, index, checkSum }) => {
    const dataString = `${index}:${dataArray.length}:${checkSum}/${dataArray[index]}`;
    return dataString;
  }

  _getCurrentSpeed = () => this.speedArray[this.speedIndex];

  _startNextIndexTimer = () => {
    this._stopNextIndexTimer();
    const currentSpeed = this._getCurrentSpeed();

    if (currentSpeed) {
      this.indexTimer = setTimeout(this._nextIndex, currentSpeed);
    }
  }

  _getIndexScrollWidth = () => this.indexScrollWidth

  _convertScrollToIndex = (scrollX) => {
    const { dataArray } = this.state;
    const indexScrollWidth = this._getIndexScrollWidth();

    let index = parseInt(scrollX / indexScrollWidth, 10);
    if (index >= dataArray.length) {
      index = dataArray.length - 1;
    }

    if (index < 0) {
      index = 0;
    }

    return index;
  }

  _convertIndexToScroll = (index) => {
    const indexScrollWidth = this._getIndexScrollWidth();
    const x = (index + 0.5) * indexScrollWidth;
    return x;
  }

  _nextIndex = () => {
    const { dataArray } = this.state;
    const oldIndex = this._convertScrollToIndex(this.scrollX);

    let index = oldIndex + 1;

    if (index >= dataArray.length) {
      index = 0;
    }

    const x = this._convertIndexToScroll(index);

    this.scrollX = x;
    this.scrollRef.scrollTo({ x, animated: false });
    this._startNextIndexTimer();
  }

  _indexScroll = ({ nativeEvent }) => {
    this.scrollX = parseInt(nativeEvent.contentOffset.x, 10);
    const index = parseInt(this._convertScrollToIndex(this.scrollX), 10);

    if (this.prevIndex === index) {
      return false;
    }

    this.prevIndex = index;
    this.setState({
      index,
    });

    return true;
  }

  _changeSpeed = () => {
    this.speedIndex += 1;

    if (this.speedIndex >= this.speedArray.length) {
      this.speedIndex = 0;
    }

    this._startNextIndexTimer();
  }

  _startNextIndexTimerWithTimeout = (time) => {
    clearTimeout(this.timeoutBegin);
    this.timeoutBegin = setTimeout(this._startNextIndexTimer, time);
  }

  render() {
    const { renderCurrentItem, ecl, itemContainerStyle, containerStyle, qrWidth } = this.props;
    const { index, dataArray, checkSum } = this.state;
    const dataString = this._createDataString({ index, dataArray, checkSum });

    return (
      <View>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          ref={(c) => { this.scrollRef = c; }}
          scrollEventThrottle={16}
          onTouchStart={() => { this._stopNextIndexTimer(); }}
          onTouchEnd={() => { this._startNextIndexTimerWithTimeout(1500); }}
          onScrollEndDrag={() => { this._startNextIndexTimerWithTimeout(1500); }}
          onMomentumScrollEnd={() => { this._startNextIndexTimerWithTimeout(500); }}
          onScroll={this._indexScroll}
          style={{
            position: 'absolute', width: qrWidth, height: '100%',
          }}
          contentContainerStyle={{ width: qrWidth + dataArray.length * this.indexScrollWidth }}
        />
        <View pointerEvents="none" style={containerStyle}>
          <QRCode
            value={dataString}
            size={qrWidth}
            ecl={ecl}
          />
          <View style={itemContainerStyle}>
            { renderCurrentItem({ index, length: dataArray.length }) }
          </View>
        </View>
      </View>
    );
  }
}

QrDataTransferSender.propTypes = {
  data: PropTypes.string,
  maxSize: PropTypes.number,
  ecl: PropTypes.string,
  renderCurrentItem: PropTypes.func,
  itemContainerStyle: ViewPropTypes.style,
  containerStyle: ViewPropTypes.style,
  qrWidth: PropTypes.number,
};

QrDataTransferSender.defaultProps = {
  data: 'TESTDATA',
  maxSize: 580,
  ecl: 'L',
  renderCurrentItem: ({ index, length }) => (<Text>{ `${index + 1}/${length}` }</Text>),
  itemContainerStyle: null,
  containerStyle: null,
  qrWidth: 289,
};

export default QrDataTransferSender;
