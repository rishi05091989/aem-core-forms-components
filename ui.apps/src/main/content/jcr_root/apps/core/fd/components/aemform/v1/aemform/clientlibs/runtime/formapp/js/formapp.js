/*
 *  Copyright 2020 Adobe
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

(function () {
    var guideBridge, aemFormConfig,
        onSubmit = function (guideResultObj) {
            var data = guideResultObj.data, element, iframeDocument, afSuccessPayload = JSON.parse(data.afSuccessPayload);
            if (aemFormConfig.thankyouConfig === "page") {
                var inlineSubmitTypeWithoutIframe = aemFormConfig.useIframe === "false" && aemFormConfig.submitType === "inline",
                    pageRefreshSubmitTypeWithIframe = aemFormConfig.useIframe === "true" && aemFormConfig.submitType === "pageRefresh";

                if (pageRefreshSubmitTypeWithIframe) {
                    window.parent.window.location.href = afSuccessPayload.thankYouContent;
                } else if (inlineSubmitTypeWithoutIframe) {
                    var message = "Refresh page on submission not selected.";
                    if (window.console && window.console.warn) {
                        console.warn(message);
                    } else {
                        guideBridge._guide.logger().log(message);
                    }
                }
            } else {
                if (aemFormConfig.useIframe !== "false") {
                    iframeDocument = $("#aemFormFrame")[0].contentWindow.document;
                    element = iframeDocument.createElement("div");
                } else {
                    element = $(".aemformcontainer")[0];
                }
                //honor thankYou message coming from server side.
                element.innerHTML = afSuccessPayload.thankYouContent;
                element.style.textAlign = "center";
                element.style.marginTop = "20px";
                element.setAttribute("data-iframe-height", "");
                /*When iframe is not used, iframedocument is undefined*/
                if (iframeDocument) {
                    iframeDocument.body.innerHTML = "";
                    iframeDocument.body.appendChild(element);
                }
            }
            guideBridge._guide.executeExpression("submitSuccess", afSuccessPayload);
        },
        updateForm = function (guideBridge) {
            if (aemFormConfig.useIframe !== "false" && aemFormConfig.height == "auto") {
                iFrameResize({
                    autoResize : true,
                    scrolling : true,
                    heightCalculationMethod : "taggedElement"
                }, "#aemFormFrame");
            }
            if (aemFormConfig.height != "auto") {
                $("#aemFormFrame").css("height", aemFormConfig.height);
            }
            var submitConfig = {},
                formElement,
                inlineSubmitTypeWithoutIframe = aemFormConfig.useIframe === "false" && aemFormConfig.submitType === "inline",
                pageRefreshSubmitTypeWithIframe = aemFormConfig.useIframe === "true" && aemFormConfig.submitType === "pageRefresh";

            if (aemFormConfig.thankyouConfig === "page") {
                submitConfig.thankyouPage = aemFormConfig.thankyouPage === "" ? null : aemFormConfig.thankyouPage;
            }
            if (aemFormConfig.thankyouConfig === "message" || inlineSubmitTypeWithoutIframe || pageRefreshSubmitTypeWithIframe) {
                submitConfig.useAjax = true;
                submitConfig.submitSuccessHandler = onSubmit;
            } else {
                if (aemFormConfig.submitType === "pageRefresh" && aemFormConfig.useIframe !== "false") {
                    formElement = document.createElement("form");
                    formElement.setAttribute("method", "POST");
                    formElement.setAttribute("enctype", "multipart/form-data");
                    document.body.appendChild(formElement);
                    submitConfig.form = formElement;
                }
            }
            submitConfig.aemFormComponentPath = aemFormConfig.aemFormComponentPath;
            guideBridge.registerConfig("submitConfig", submitConfig);
        },
        initAEMForm = function (evnt) {
            guideBridge = evnt.detail.guideBridge;
            updateForm(guideBridge);
            window.removeEventListener("bridgeInitializeStart", initAEMForm);
        },
        connectWithGuideBridge = function () {
            if (window.guideBridge) {
                guideBridge = window.guideBridge;
                updateForm(guideBridge);
            } else {
                window.addEventListener("bridgeInitializeStart", initAEMForm);
            }
        },
        initializeAEMForm = function (config) {
            aemFormConfig = config;
            if (config.form == "true") {
                connectWithGuideBridge();
            }
        },
        tmpEvent = document.createEvent("CustomEvent");

    tmpEvent.initCustomEvent("aemform-onscript-load", true, true, {
        formApp : {
            initializeAEMForm : initializeAEMForm
        }
    });
    window.dispatchEvent(tmpEvent);
}());
