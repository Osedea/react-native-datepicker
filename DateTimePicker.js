import React, { Component } from 'react';
import {
    DatePickerIOS,
    DatePickerAndroid,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TimePickerAndroid,
    View,
} from 'react-native';
import Button from 'react-native-osd-simple-button';
import PropTypes from 'prop-types'

const styles = StyleSheet.create({
    dateDisplay: {
        backgroundColor: '#FFFFFF',
        ...(Platform.OS === 'ios'
            ? {
                borderWidth: 1,
                borderRadius: 4, // Tried to fit with the apple doc https://developer.apple.com/library/ios/documentation/UserExperience/Conceptual/MobileHIG/Controls.html#//apple_ref/doc/uid/TP40006556-CH15-SW1
            }
            : {}
        ),
        borderColor: '#DDDDDD',
        justifyContent: 'center',
    },
    dateTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    iosClosePickerButton: {
        backgroundColor: '#00CC00',
        width: Dimensions.get('window').width,
        borderWidth: 0,
        borderRadius: 0,
        marginBottom: 0,
    },
    iosPickerContainer: {
        position: 'absolute',
        bottom: 0,
        width: Dimensions.get('window').width,
        backgroundColor: '#FFFFFF',
        justifyContent: 'flex-end',
    },
    label: {
        flex: 1,
    },
    value: {
        flex: 1,
        textAlign: 'right',
    },
});

export default class DateTimePicker extends Component {
    static propTypes = {
        date: PropTypes.oneOfType([
            PropTypes.date,
            PropTypes.string,
        ]),
        iosDoneButtonText: PropTypes.string,
        iosDoneButtonStyle: PropTypes.containerStyle,
        iosClosePickerButtonTextContainerStyle: PropTypes.textContainerStyle,
        iosClosePickerButtonTextStyle: PropTypes.textStyle,
        label: PropTypes.string,
        mode: PropTypes.oneOf([
            'datetime',
            'date',
            'time',
        ]),
        onChange: PropTypes.func.isRequired,
        renderAndroidButton: PropTypes.func,
    };

    static defaultProps = {
        mode: 'datetime',
        iosDoneButtonText: 'Done',
    };

    constructor(props) {
        super(props);
        let currentDate = null,
            minDate     = null,
            maxDate     = null;

        if (props.date) {
            currentDate = typeof props.date === 'string'
                ? this.parseStringDate(props.date)
                : props.date;
        }

        if (props.minDate) {
            minDate = typeof props.minDate === 'string'
                ? this.parseStringDate(props.minDate)
                : props.minDate;
        }

        if (props.maxDate) {
            maxDate = typeof props.maxDate === 'string'
                ? this.parseStringDate(props.maxDate)
                : props.maxDate;
        }

        this.state = {
            date: currentDate,
            minDate: minDate,
            maxDate: maxDate,
            label: props.label || props.mode.toUpperCase(),
            mode: props.mode,
            pickerVisible: false,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.date) {
            this.setState({
                date: typeof nextProps.date === 'string'
                    ? this.parseStringDate(nextProps.date)
                    : nextProps.date,
            });
        }
    }

    getDisplayValue = (date) => {
        if (!date) {
            return null;
        }

        if (this.props.mode === 'time') {
            date.setSeconds(0);

            return date.toLocaleTimeString();
        } else if (this.props.mode === 'date') {
            return date.toLocaleDateString();
        } else {
            return date.toLocaleString();
        }
    }

    getReturnValue = (date) => {
        if (!date) {
            return null;
        }

        if (this.props.mode === 'time') {
            date.setSeconds(0);

            return date.toTimeString();
        } else if (this.props.mode === 'date') {
            return date.toDateString();
        } else {
            return date.toString();
        }
    }

    parseStringDate = (stringDate) => {
        let date;
        const matchTime = stringDate.match(/^ *([0-9]+):([0-9]+):00 ([AP]M)?/);

        if (matchTime) {
            date = new Date();
            if (matchTime[3] === 'PM' && matchTime[1] !== '12') {
                date.setHours(Number(matchTime[1]) + 12);
            } else if (matchTime[3] === 'AM' && matchTime[1] === '12') {
                date.setHours(0);
            } else {
                date.setHours(matchTime[1]);
            }
            date.setMinutes(matchTime[2]);
            date.setSeconds(0);
        } else {
            date = new Date(stringDate);
        }

        const parsedDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes()
        );

        return parsedDate;
    };

    handleDateChange = (date) => {
        this.setState({ date });
        this.props.onChange(this.getReturnValue(date));
    };

    handleAndroidPickerDisplay = () => {
        if (this.props.mode === 'date' || this.props.mode === 'datetime') {
            let minMax = {};

            if (this.state.minDate) {
                minMax.minDate = this.state.minDate;
            }
            if (this.state.maxDate) {
                minMax.maxDate = this.state.maxDate;
            }

            DatePickerAndroid.open({
                date: this.state.date || new Date(),
                ...minMax,
            })
            .then(({ datePickerAction, year, month, day }) => {
                if (datePickerAction !== DatePickerAndroid.dismissedAction) {
                    if (this.props.mode === 'datetime') {
                        TimePickerAndroid.open({
                            ...(this.state.date
                                ? {
                                    hour: this.state.date.getHours(),
                                    minute: this.state.date.getMinutes(),
                                }
                                : {}
                            ),
                        })
                        .then(({ timePickerAction, hour, minute }) => {
                            if (timePickerAction !== TimePickerAndroid.dismissedAction) {
                                const dateWithHoursAndMinutes = new Date(
                                    year,
                                    month,
                                    day,
                                    hour,
                                    minute
                                );

                                this.handleDateChange(dateWithHoursAndMinutes);
                            }
                        })
                        .catch(({ code, message }) => console.info(`Cannot open date picker ${code}`, message));
                    } else {
                        const newDate = new Date(year, month, day);

                        this.handleDateChange(newDate);
                    }
                }
            })
            .catch(({ code, message }) => console.info(`Cannot open date picker ${code}`, message));
        } else if (this.props.mode === 'time') {
            TimePickerAndroid.open({
                ...(this.state.date
                    ? {
                        hour: this.state.date.getHours(),
                        minute: this.state.date.getMinutes(),
                    }
                    : {}
                ),
            })
            .then(({ action, hour, minute }) => {
                if (action !== TimePickerAndroid.dismissedAction) {
                    const date = new Date();

                    date.setHours(hour);
                    date.setMinutes(minute);
                    date.setSeconds(0);

                    this.handleDateChange(date);
                }
            })
            .catch(({ code, message }) => console.info(`Cannot open date picker ${code}`, message));
        }
    };

    handleIOSPickerDisplay = () => {
        this.setState({
            pickerVisible: true,
        });
    };

    handleClose = () => {
        this.setState({
            pickerVisible: false,
        });

        if (!this.state.date) {
            this.handleDateChange(new Date());
        }
    };

    render() {
        let iosPicker = null;

        if (Platform.OS === 'ios') {
            iosPicker = (
                <Modal
                    animationType={'slide'}
                    transparent={true}
                    visible={this.state.pickerVisible}
                    onRequestClose={this.handleClose}
                >
                    <View
                        style={styles.modalBackground}
                    >
                        <View style={styles.iosPickerContainer}>
                            <DatePickerIOS
                                date={this.state.date || new Date()}
                                minimumDate={this.state.minDate}
                                maximumDate={this.state.maxDate }
                                mode={this.state.mode}
                                onDateChange={this.handleDateChange}
                            />
                            <Button
                                containerStyle={[
                                    styles.iosClosePickerButton,
                                    this.props.iosDoneButtonStyle,
                                ]}
                                textContainerStyle={[
                                    this.props.iosClosePickerButtontextContainerStyle,
                                ]}
                                textStyle={[
                                    this.props.iosClosePickerButtontextStyle,
                                ]}
                                text={this.props.iosDoneButtonText}
                                onPress={this.handleClose}
                            />
                        </View>
                    </View>
                </Modal>
            );
        }

        const toRender = (
            <View>
                <Button
                    containerStyle={styles.dateDisplay}
                    textContainerStyle={styles.dateTextContainer}
                    onPress={Platform.OS === 'ios'
                        ? this.handleIOSPickerDisplay
                        : this.handleAndroidPickerDisplay
                    }
                    underlayColor={'rgba(0, 0, 0, 0.5)'}
                >
                    <Text style={styles.label}>{this.state.label}</Text>
                    <Text style={styles.value}>
                        {this.getDisplayValue(this.state.date)}
                    </Text>
                </Button>
                {iosPicker}
            </View>
        );


        return (
            <View>
                {Platform.OS === 'android' && this.props.renderAndroidButton
                    ? (this.props.renderAndroidButton)()
                    : toRender
                }
            </View>
        );
    }
}
