import { AliCloudClientOptions } from './AliCloudClient';
import { type RecognizeIdcardRoot } from './OcrV20210707.types';

export interface OcrV20210707Api {
  $product: 'ocr-api';
  $version: '2021-07-07';

  /**
   * 全文识别高精版。
   *
   * @remarks
   *
   * 全文识别高精版
   * #### 本接口适用场景
   * * 阿里云全文识别高精版，是阿里云官方自研OCR文字识别产品，智能识别图片所包含的全部字段，集表格识别、旋转识别、生僻字识别等多功能为一体，提供高性价比的多场景文字识别体验。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i1/O1CN01JW5Amf1TfpKdxvNhB_!!6000000002410-2-tps-1105-549.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |多功能集结|集表格识别、旋转识别、生僻字识别等多功能为一体。|
   * |抗干扰|支持多格式版面、复杂文档背景和光照环境的精准识别。|
   * |自动排异|对有印章、手印的文档，可实现印章查处后识别。|
   * |高阶能力|支持覆盖文字编辑、低置信度过滤、图案检测。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [通用文字识别](https://common-buy.aliyun.com?commodityCode=ocr_general_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=universal&subtype=general#intro)免费体验本功能识别效果。|
   * |2|购买[全文识别高精版资源包](https://common-buy.aliyun.com/?commodityCode=ocr_general_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_general_dp_cn_20211103172431_0719%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeAdvanced?lang=JAVA&sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeAdvanced(req: RecognizeAdvancedRequest, opts?: AliCloudClientOptions): Promise<RecognizeAdvancedResponse>;
  /**
   * 通用手写体识别。
   *
   * @remarks
   *
   * 通用手写体识别
   * #### 本接口适用场景
   * * 阿里云通用手写体识别，是阿里云官方自研OCR文字识别产品，适用于获取手写体书面形式的文字场景，适用于各类手写笔记、板书等。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1xvaLcggP7K4jSZFqXXamhVXa-1600-920.jpg" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |多文字形式|支持中文手写体、英文手写体、数字手写体。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [通用文字识别](https://common-buy.aliyun.com?commodityCode=ocr_general_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=universal&subtype=shouxie#intro)免费体验本功能识别效果。|
   * |2|购买[通用手写体识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_general_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_general_dp_cn_20211103172431_0249%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeHandwriting?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   * |相关能力|<ul> <li> [云市场手写体识别。](https://market.aliyun.com/products/57124001/cmapi00040832.html?#sku=yuncode3483200001) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeHandwriting(
    req: RecognizeHandwritingRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeHandwritingResponse>;
  /**
   * 电商图片文字识别。
   *
   * @remarks
   *
   * 电商图片文字识别
   * #### 本接口适用场景
   * * 阿里云电商图片文字识别，是阿里云官方自研OCR文字识别产品，支持电商商品宣传图片、社区贴吧图片、网络UGC图片识别，针对电商海量图片内容核查就场景进行特定优化，只输出文字块内容及坐标，极大提升识别效率。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i4/O1CN01beY6FP20nVIAEwIiL_!!6000000006894-0-tps-850-443.jpg" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |多网络场景|电商商品宣传图片、社区贴吧图片、网络UGC图片等网络场景识别文字。|
   * |适用场合|适用于违规广告识别、信息审核管理和网络安全治理等场景。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [通用文字识别](https://common-buy.aliyun.com?commodityCode=ocr_general_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=universal&subtype=ecommerce#intro)免费体验本功能识别效果。|
   * |2|购买[电商图片文字识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_general_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_general_dp_cn_20211103172431_0503%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeBasic?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeBasic(req: RecognizeBasicRequest, opts?: AliCloudClientOptions): Promise<RecognizeBasicResponse>;
  /**
   * 通用文字识别。
   *
   * @remarks
   *
   * 通用文字识别
   * #### 本接口适用场景
   * * 阿里云通用文字识别，是阿里云官方自研OCR文字识别产品，适用于各类常见文档图片或文档扫描件中的文字信息按照文档原有的格式智能识别文字并结构化输出识别结果。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i1/O1CN01JW5Amf1TfpKdxvNhB_!!6000000002410-2-tps-1105-549.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |全字段识别|结构化识别图片上所包含的全字段，并返回JSON。|
   * |图像增强|默认支持图像增强，包括图像畸变自动矫正、模糊图片自动增强等能力。|
   * |高精度高性能|超高精度及性能；识别准确率位于行业前列，识别速度显著高于国内其他OCR云服务。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [通用文字识别](https://common-buy.aliyun.com?commodityCode=ocr_general_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=universal&subtype=general_text#intro)免费体验本功能识别效果。|
   * |2|购买[通用文字识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_general_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_general_dp_cn_20211103172431_0908%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeGeneral?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeGeneral(req: RecognizeGeneralRequest, opts?: AliCloudClientOptions): Promise<RecognizeGeneralResponse>;
  /**
   * 表格识别。
   *
   * @remarks
   *
   * 表格识别
   * #### 本接口适用场景
   * * 阿里云表格识别，是阿里云官方自研OCR文字识别产品，支持对多种表格格式（有线表格、条纹表格、无线表格）进行智能文字识别并结构化输出识别结果。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/6884068261/p303185.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |多格式|支持有线表格、条纹表格、无线表格、手写表格识别。|
   * |全字段识别|智能识别图片上的表格所包含的全部字段。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |置信度对比|对低置信度文字进行标红处理，便于二次确认。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [通用文字识别](https://common-buy.aliyun.com?commodityCode=ocr_general_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=universal&subtype=table#intro)免费体验本功能识别效果。|
   * |2|购买[表格识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_general_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_general_dp_cn_20211103172431_0075%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeTableOcr?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   *
   * 注：PDF文件格式的表格解析请点击[表格智能解析](https://help.aliyun.com/document_detail/450742.html)快速了解
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeTableOcr(req: RecognizeTableOcrRequest, opts?: AliCloudClientOptions): Promise<RecognizeTableOcrResponse>;
  /**
   * 防疫健康码识别。
   *
   * @remarks
   *
   * 防疫健康码识别
   * #### 本接口适用场景
   * * 阿里云防疫健康码识别，是阿里云官方自研OCR文字识别产品，适用于获取健康码上的健康码颜色、姓名、日期等关键信息的场景。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/7365590561/p433785.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |全字段识别|智能识别营业执照上所包含的全部字段。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [通用文字识别](https://common-buy.aliyun.com?commodityCode=ocr_general_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=universal&subtype=health_code#intro)免费体验本功能识别效果。|
   * |2|购买[防疫健康码识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_general_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_general_dp_cn_20220419111546_0636%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeHealthCode?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|。
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeHealthCode(
    req: RecognizeHealthCodeRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeHealthCodeResponse>;
  /**
   * 文档结构化识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeDocumentStructure(
    req: RecognizeDocumentStructureRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeDocumentStructureResponse>;
  /**
   * 身份证识别。
   *
   * @remarks
   *
   * 身份证识别
   * #### 本接口适用场景
   *   * 阿里云身份证文字识别，是阿里云官方自研OCR文字识别产品，用于对中国大陆身份证（含临时身份证）正反面图片进行智能文字识别并结构化输出识别结果。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i3/O1CN01VMB4xL1kWWl9GqGNt_!!6000000004691-0-tps-1071-532.jpg" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |多类型覆盖|支持自动区分正反面、支持少数民族版式识别、临时身份证识别、生僻字识别、反光实拍、劣质图像识别。<img width=1000/>|
   * |风险检测|支持证件风险检测预警能力，包括智能判断图片完整度、复印件检测、翻拍检测、质量分等。|
   * |人像检测|支持图像检测功能，可定位身份证中的人像图案并返回坐标。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [个人证照识别](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=standard&subtype=idcard#intro)免费体验本功能识别效果。|
   * |2|购买[身份证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_personalcard_dp_cn_20211018150333_0014%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](~~295347~~)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeIdcard?lang=SWIFT&sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](~~93720~~)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](~~116146~~)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |国家与语言| <ul> <li>本接口只支持中国大陆身份证。</li></ul> |
   * |其他提示|<ul> <li>请保证整张身份证内容及其边缘包含在图像内。 </li> <li> 本能力会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   * |相关能力|<ul> <li> [身份证混贴识别。](https://market.aliyun.com/products/57124001/cmapi00042846.html?#sku=yuncode3684600001) </li> <li> [国际身份证识别。](~~455939~~) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeIdcard(req: RecognizeIdcardRequest, opts?: AliCloudClientOptions): Promise<RecognizeIdcardResponse>;
  /**
   * 护照识别。
   *
   * @remarks
   *
   * 护照识别
   * #### 本接口适用场景
   *   * 阿里云国际护照识别，是阿里云官方自研OCR文字识别产品，适用于出入境审查、国内外身份核验等各种需要提取护照信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i4/O1CN01A0sPpE1ZzPvVTa6QV_!!6000000003265-2-tps-2482-1193.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |多国护照|对美国、法国、英国、日本、韩国等多国和地区护照提供识别服务。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [个人证照识别](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=standard&subtype=passport#intro)免费体验本功能识别效果。|
   * |2|购买[国际护照识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_personalcard_dp_cn_20211018150333_0624%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizePassport?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP、OFD、PDF。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |相关能力|<ul> <li> [云市场护照识别。](https://market.aliyun.com/products/57124001/cmapi016682.html?spm=a2c4g.11186623.0.0.47e98a21paGIxa&innerSource=search#sku=yuncode1068200007) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizePassport(req: RecognizePassportRequest, opts?: AliCloudClientOptions): Promise<RecognizePassportResponse>;
  /**
   * 户口本识别，支持户口本户主页和常住人口页识别。
   *
   * @remarks
   *
   * 户口本识别
   * #### 本接口适用场景
   *   * 阿里云户口本识别，是阿里云官方自研OCR文字识别产品，可用于识别户口本户主页的户主姓名、住址、户号等字段。也适用于识别户口本常住人口页的出生日期、出生地、姓名、民族等信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i2/O1CN01XgQQf11PBoxYZP19J_!!6000000001803-2-tps-2458-1318.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [个人证照识别](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=standard&subtype=household#intro)免费体验本功能识别效果。|
   * |2|购买 [个人证照识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_personalcard_dp_cn_20211018150333_0555%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeHousehold?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeHousehold(req: RecognizeHouseholdRequest, opts?: AliCloudClientOptions): Promise<RecognizeHouseholdResponse>;
  /**
   * 不动产权证识别。
   *
   * @remarks
   *
   * 不动产权证识别
   * #### 本接口适用场景
   *   * 阿里云不动产权证识别，是阿里云官方自研OCR文字识别产品，适用于识别不动产权证和房产证上的关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1Nk0DOpP7gK0jSZFjXXc5aXXa-1600-920.jpg" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |适用范围广|适用于全国各地的不同不动产权证和房产证识别。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [个人证照识别](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=standard&subtype=estate_cert#intro)免费体验本功能识别效果。|
   * |2|购买[不动产权证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_personalcard_dp_cn_20211018150333_0807%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeEstateCertification?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |相关能力|<ul> <li> [云市场不动产权证识别。](https://market.aliyun.com/products/57124001/cmapi032590.html?spm=a2c4g.11186623.0.0.53898a21nnCeEE#sku=yuncode2659000001) </li>  </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeEstateCertification(
    req: RecognizeEstateCertificationRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeEstateCertificationResponse>;
  /**
   * 银行卡识别。
   *
   * @remarks
   *
   * 银行卡识别
   * #### 本接口适用场景
   *   * 阿里云银行卡识别，是阿里云官方自研OCR文字识别产品，适用于获取银行卡上的卡号、日期、银行名称等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1gbfaN7L0gK0jSZFAXXcA9pXa-1600-800.jpg" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |多银行|支持中国银行、中国工商银行、交通银行、邮政银行等多家银行。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |多卡面类型|支持各种位数、凸字卡面、平面卡面的识别。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [个人证照识别](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=standard&subtype=bank_card#intro)免费体验本功能识别效果。|
   * |2|购买 [银行卡识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_personalcard_dp_cn_20211018150333_0139%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeBankCard?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |相关能力|<ul> <li> [云市场银行卡识别。](https://market.aliyun.com/products/57124001/cmapi016870.html?spm=a2c4g.11186623.0.0.47e98a21uyjeUi&innerSource=search#sku=yuncode1087000000) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeBankCard(req: RecognizeBankCardRequest, opts?: AliCloudClientOptions): Promise<RecognizeBankCardResponse>;
  /**
   * 出生证明。
   *
   * @remarks
   *
   * 出生证明识别
   * #### 本接口适用场景
   *   * 阿里云出生证明识别，是阿里云官方自研OCR文字识别产品，适用于识别出生证明所包含的新生儿姓名、性别、出生日期、出生地点等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1gN1UkRFR4u4jSZFPXXanzFXa-2060-1404.jpg" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图片格式|支持PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [个人证照识别](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=standard&subtype=birth_certification#intro)免费体验本功能识别效果。|
   * |2|购买[出生证明识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_personalcard_dp_cn_20211018150333_0645%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeBirthCertification?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li></ul>|
   * |相关能力|<ul> <li> [云市场出生证明识别。](https://market.aliyun.com/products/57124001/cmapi00043620.html?spm=a2c4g.11186623.0.0.47e98a21Sz0eAq#sku=yuncode3762000001) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeBirthCertification(
    req: RecognizeBirthCertificationRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeBirthCertificationResponse>;
  /**
   * 中国护照识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeChinesePassport(
    req: RecognizeChinesePassportRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeChinesePassportResponse>;
  /**
   * 来往大陆（内地）通行证识别。
   *
   * @remarks
   *
   * 来往大陆（内地）通行证识别
   * #### 本接口适用场景
   *   * 阿里云来往大陆通行证识别，精准识别通行证中所包含的中英文姓名、出生日期、有效期限、签发地点、证件号码等信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例（仅支持正面识别）
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i2/O1CN01VpucoK1PtmovU859J_!!6000000001899-0-tps-928-626.jpg" width="50%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [个人证照识别](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=standard&subtype=mainland_card#intro)免费体验本功能识别效果。|
   * |2|购买 [个人证照识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_personalcard_dp_cn_20211222165053_0134%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeExitEntryPermitToMainland?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |识别范围|<ul> <li> 本接口只支持正面识别，背面不支持。
   *
   * -----
   * ### 请求参数
   * * URL
   *   * 本字段和body字段二选一，不可同时透传或同时为空。
   *   * 图片链接（长度不超2048，不支持base64）。
   * * body
   *   * 本字段和URL字段二选一，不可同时透传或同时为空。
   *   * 图片二进制文件，最大10MB。
   *   * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   *   * 使用SDK的方式调用，把图片放到SDK的body中即可。
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeExitEntryPermitToMainland(
    req: RecognizeExitEntryPermitToMainlandRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeExitEntryPermitToMainlandResponse>;
  /**
   * 往来港澳台通行证识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeExitEntryPermitToHK(
    req: RecognizeExitEntryPermitToHKRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeExitEntryPermitToHKResponse>;
  /**
   * 中国香港身份证识别。
   *
   * @remarks
   *
   * 中国香港身份证识别
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [个人证照识别](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_public_cn) 服务。|
   * |2|购买[中国香港身份证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_personalcard_dp_cn_20230323152059_0554%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeHKIdcard?sdkStyle=dara&tab=DEMO&lang=JAVA)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |国家与语言| <ul> <li>本接口只支持中国香港身份证。</li></ul> |
   * |其他提示|<ul> <li>请保证整张身份证内容及其边缘包含在图像内。 </li> <li> 本能力会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   * |相关能力|<ul> <li> [国际身份证识别。](https://help.aliyun.com/document_detail/455939.html) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeHKIdcard(req: RecognizeHKIdcardRequest, opts?: AliCloudClientOptions): Promise<RecognizeHKIdcardResponse>;
  /**
   * 社保卡识别。
   *
   * @remarks
   *
   * 社保卡识别
   * #### 本接口适用场景
   *   * 阿里云社保卡识别，是阿里云官方自研OCR文字识别产品，适用于识别社会保障卡中所包含的标题、姓名、社保卡号码、卡号、发卡日期等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i1/O1CN01lTV8Qu1jeU1ycPA30_!!6000000004573-2-tps-820-272.png" width="60%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达97%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [个人证照识别](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=standard&subtype=social_security_card#intro)免费体验本功能识别效果。|
   * |2|购买[个人证照识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_personalcard_dp_cn_20220507144415_0128%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeSocialSecurityCardVersionII?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。</li> </ul> |
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeSocialSecurityCardVersionII(
    req: RecognizeSocialSecurityCardVersionIIRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeSocialSecurityCardVersionIIResponse>;
  /**
   * 国际身份证识别。
   *
   * @remarks
   *
   * 国际身份证识别
   * #### 本接口适用场景
   *   * 阿里云国际身份证识别，是阿里云官方自研OCR文字识别产品，适用于出入境审查、国内外身份核验等各种需要提取身份证信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i3/O1CN01VMB4xL1kWWl9GqGNt_!!6000000004691-0-tps-1071-532.jpg" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |多国身份证|对越南、韩国、印度、孟加拉居民身份证提供识别服务|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [个人证照识别](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=standard&subtype=idcard#intro)免费体验本功能识别效果。|
   * |2|购买[国际身份证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_personalcard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_personalcard_dp_cn_20220829103503_0482%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeInternationalIdcard?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP、OFD、PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>请保证整张身份证内容及其边缘包含在图像内。 </li> <li> 本能力会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeInternationalIdcard(
    req: RecognizeInternationalIdcardRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeInternationalIdcardResponse>;
  /**
   * 混贴发票识别。
   *
   * @remarks
   *
   * 混贴发票识别
   * #### 本接口适用场景
   *   * 阿里云混贴发票识别，是阿里云官方自研OCR文字识别产品，适用于获取多种发票集合在一个页面的场景，需要获取多种发票上的关键信息。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i4/O1CN018t7r7W1mCx440fhmU_!!6000000004919-2-tps-1052-594.png" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |全字段识别|智能识别混贴发票上所包含的全部字段。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票据凭证识别](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=bill&subtype=multi_invoice#intro)免费体验本功能识别效果。|
   * |2|购买[混贴发票识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_invoice_dp_cn_20211103182712_0880%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeMixedInvoices?lang=PHP&sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP、PDF、OFD。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> URL长度不能超过2048。 </li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |当前支持的发票类型|出租车票、火车票、银行承兑汇票、网约车行程单、二手车销售统一发票、定额发票、机票行程单、机动车销售统一发票、增值税发票、卷票、过路过桥费发票、通用机打发票、税收完税证明、客运车船票、非税收入票据。|
   * |相关能力|<ul> <li> [云市场混贴票据识别。](https://market.aliyun.com/products/57124001/cmapi00034969.html?spm=a2c4g.11186623.0.0.6dcb4dcdy2b5CR#sku=yuncode2896900002) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeMixedInvoices(
    req: RecognizeMixedInvoicesRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeMixedInvoicesResponse>;
  /**
   * 增值税发票。
   *
   * @remarks
   *
   * 增值税发票识别
   * #### 本接口适用场景
   *   * 阿里云增值税发票识别，是阿里云官方自研OCR文字识别产品，适用于识别增值税发票上所包含的价税合计、发票代码、发票号码等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1D2NXpIKfxu4jSZPfXXb3dXXa-2060-1200.jpg" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票据凭证识别](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=bill&subtype=invoice#intro)免费体验本功能识别效果。|
   * |2|购买[增值税发票识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_invoice_dp_cn_20211103182712_0783%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeInvoice?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * ------
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP、PDF、OFD。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |相关能力|<ul> <li> [云市场增值税发票识别。](https://market.aliyun.com/products/57124001/cmapi027758.html?spm=a2c4g.11186623.0.0.1ff64dcdDsX9s8#sku=yuncode2175800000) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeInvoice(req: RecognizeInvoiceRequest, opts?: AliCloudClientOptions): Promise<RecognizeInvoiceResponse>;
  /**
   * 机动车统一销售发票。
   *
   * @remarks
   *
   * 机动车统一销售发票识别
   * #### 本接口适用场景
   *   * 阿里云机动车销售发票识别，是阿里云官方自研OCR文字识别产品，适用于识别购车发票上的发票金额、购买方名称、车辆类型、厂牌型号、销售方名称等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1k5AyamslXu8jSZFuXXXg7FXa-2060-1000.jpg" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图片格式|支持PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票据凭证识别](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=bill&subtype=car_invoice#intro)免费体验本功能识别效果。|
   * |2|购买[机动车销售发票识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_invoice_dp_cn_20211103182712_0430%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeCarInvoice?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * ------
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |相关能力|<ul> <li> [云市场机动车销售发票识别。](https://market.aliyun.com/products/57124001/cmapi029811.html?spm=a2c4g.11186623.0.0.6dcb4dcdaoX2WN#sku=yuncode2381100001) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeCarInvoice(
    req: RecognizeCarInvoiceRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeCarInvoiceResponse>;
  /**
   * 定额发票。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeQuotaInvoice(
    req: RecognizeQuotaInvoiceRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeQuotaInvoiceResponse>;
  /**
   * 航空行程单识别。
   *
   * @remarks
   *
   * 航空行程单识别
   * #### 本接口适用场景
   *   * 阿里云航空行程单识别，是阿里云官方自研OCR文字识别产品，适用于识别航空行程单所包含的乘机人姓名、身份证号、电子客票号码、验证码、填开日期、销售单位代号、承运人、填开单位、票价、税费、燃油附加费等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i1/O1CN01B5q2Z321hNcDMA9zN_!!6000000007016-2-tps-825-318.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票据凭证识别](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=bill&subtype=air_itinerary#intro)免费体验本功能识别效果。|
   * |2|购买 [票据凭证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_invoice_dp_cn_20211103182712_0981%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeAirItinerary?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP、OFD、PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li>  </ul>|
   * |相关能力|<ul> <li> [云市场航空行程单识别。](https://market.aliyun.com/products/57124001/cmapi00035385.html?#sku=yuncode2938500001) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeAirItinerary(
    req: RecognizeAirItineraryRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeAirItineraryResponse>;
  /**
   * 火车票识别。
   *
   * @remarks
   *
   * 火车票识别
   * #### 本接口适用场景
   *   * 阿里云火车票识别，是阿里云官方自研OCR文字识别产品，适用于识别火车票上车次、座位号、旅客信息、座位类型、票价等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1n9tZccVl614jSZKPXXaGjpXa-1600-800.jpg" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图片格式|支持PNG、JPG、JPEG、BMP、GIF、TIFF、WebP、OFD、PDF。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票据凭证识别](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=bill&subtype=train_ticket#intro)免费体验本功能识别效果。|
   * |2|购买[火车票识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_invoice_dp_cn_20211103182712_0135%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeTrainInvoice?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * ------
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |相关能力|<ul> <li> [云市场火车票识别。](https://market.aliyun.com/products/57124001/cmapi020096.html?spm=a2c4g.11186623.0.0.6dcb4dcdaoX2WN&innerSource=search#sku=yuncode1409600000) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeTrainInvoice(
    req: RecognizeTrainInvoiceRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeTrainInvoiceResponse>;
  /**
   * 出租车发票识别。
   *
   * @remarks
   *
   * 出租车发票识别
   * #### 本接口适用场景
   *   * 阿里云出租车发票识别，是阿里云官方自研OCR文字识别产品，适用于识别出租车发票所包含的发票代码、发票号码、金额、里程等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1.OicXebviK0jSZFNXXaApXXa-364-982.jpg" width="30%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达97%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票据凭证识别](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=bill&subtype=taxi_ticket#intro)免费体验本功能识别效果。|
   * |2|购买[票据凭证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_invoice_dp_cn_20211103182712_0996%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeTaxiInvoice?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li>  </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeTaxiInvoice(
    req: RecognizeTaxiInvoiceRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeTaxiInvoiceResponse>;
  /**
   * 增值税发票卷票。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeRollTicket(
    req: RecognizeRollTicketRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeRollTicketResponse>;
  /**
   * 银行承兑汇票识别。
   *
   * @remarks
   *
   * 银行承兑汇票识别
   * #### 本接口适用场景
   *   * 阿里云银行承兑汇票识别，是阿里云官方自研OCR文字识别产品，适用于识别银行承兑汇票上的出票日期、到期日期、票据状态、票据号码、出票人信息、售票人信息、承兑人信息等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例（仅支持正面识别，暂不支持背面识别）
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i1/O1CN017mjVfp1P2CY21py2u_!!6000000001782-2-tps-2602-1888.png" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图片格式|支持PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票据凭证识别](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=bill&subtype=bank_acceptance#intro)免费体验本功能识别效果。|
   * |2|购买[银行承兑汇票识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_invoice_dp_cn_20220506145928_0399%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeBankAcceptance?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * ------
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |相关能力|<ul> <li> [云市场银行承兑汇票识别。](https://market.aliyun.com/products/57000002/cmapi00040502.html?spm=a2c4g.11186623.0.0.6dcb4dcdaoX2WN&innerSource=search_%E9%93%B6%E6%89%BF#sku=yuncode3450200001) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeBankAcceptance(
    req: RecognizeBankAcceptanceRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeBankAcceptanceResponse>;
  /**
   * 客运车船票识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeBusShipTicket(
    req: RecognizeBusShipTicketRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeBusShipTicketResponse>;
  /**
   * 非税收入发票识别。
   *
   * @remarks
   *
   * 非税收入发票识别
   * #### 本接口适用场景
   *   * 阿里云非税收入发票识别，是阿里云官方自研OCR文字识别产品，适用于识别非税收入发票所包含的票据号码、标题、开票日期、合计金额、收款人等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i4/O1CN01jraEpU29O9qPIWKaT_!!6000000008057-0-tps-2977-1800.jpg" width="40%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达97%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票据凭证识别](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=bill&subtype=nontax_invoice#intro)免费体验本功能识别效果。|
   * |2|购买[车辆物流识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_invoice_dp_cn_20220303112214_0050%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeNonTaxInvoice?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。</li> </ul> |
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeNonTaxInvoice(
    req: RecognizeNonTaxInvoiceRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeNonTaxInvoiceResponse>;
  /**
   * 通用机打发票识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeCommonPrintedInvoice(
    req: RecognizeCommonPrintedInvoiceRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeCommonPrintedInvoiceResponse>;
  /**
   * 酒店流水识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeHotelConsume(
    req: RecognizeHotelConsumeRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeHotelConsumeResponse>;
  /**
   * 支付详情页识别。
   *
   * @remarks
   *
   * 支付详情页识别
   * #### 本接口适用场景
   *   * 阿里云支付详情页识别，是阿里云官方自研OCR文字识别产品，适用于识别支付详情页所包含的收款方名称、合计金额、付款方式、商品说明、支付时间等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i2/O1CN01pP14mQ1F2WjPhgXev_!!6000000000429-2-tps-821-313.png" width="50%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票据凭证识别](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=bill&subtype=nontax_invoice#intro)免费体验本功能识别效果。|
   * |2|购买[票据凭证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_invoice_dp_cn_20220303112214_0069%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizePaymentRecord?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。</li> </ul> |
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizePaymentRecord(
    req: RecognizePaymentRecordRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizePaymentRecordResponse>;
  /**
   * 电商订单页识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizePurchaseRecord(
    req: RecognizePurchaseRecordRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizePurchaseRecordResponse>;
  /**
   * 网约车行程单识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeRideHailingItinerary(
    req: RecognizeRideHailingItineraryRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeRideHailingItineraryResponse>;
  /**
   * 购物小票识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeShoppingReceipt(
    req: RecognizeShoppingReceiptRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeShoppingReceiptResponse>;
  /**
   * 社会保障卡识别。
   *
   * @remarks
   *
   * 社会保障卡识别
   * 此接口不再更新，不支持新用户接入。请使用新版接口：[社保卡识别](https://help.aliyun.com/document_detail/442264.html)
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeSocialSecurityCard(
    req: RecognizeSocialSecurityCardRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeSocialSecurityCardResponse>;
  /**
   * 过路过桥费发票识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeTollInvoice(
    req: RecognizeTollInvoiceRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeTollInvoiceResponse>;
  /**
   * 税收完税证明识别。
   *
   * @remarks
   *
   * 税收完税证明识别
   * #### 本接口适用场景
   *   * 阿里云税收完税证明识别，是阿里云官方自研OCR文字识别产品，适用于识别非税收入证明所包含的税务机关、纳税人识别号、纳税人名称、合计金额、填票人、完税详单等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i4/O1CN01hmLCcX1JV9xJF1joS_!!6000000001033-2-tps-757-472.png" width="50%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票据凭证识别](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=bill&subtype=tax_clearance_certificate#intro)免费体验本功能识别效果。|
   * |2|购买[票据凭证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_invoice_dp_cn_20211222173940_0304%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeTaxClearanceCertificate?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。</li> </ul> |
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeTaxClearanceCertificate(
    req: RecognizeTaxClearanceCertificateRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeTaxClearanceCertificateResponse>;
  /**
   * 二手车统一销售发票识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeUsedCarInvoice(
    req: RecognizeUsedCarInvoiceRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeUsedCarInvoiceResponse>;
  /**
   * 营业执照识别。
   *
   * @remarks
   *
   * 营业执照识别
   * #### 本接口适用场景
   *   * 阿里云营业执照识别，是阿里云官方自研OCR文字识别产品，适用于识别营业执照上的公司名称、地址、主体类型、法定代表人、注册资金、组成形式、成立日期等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i1/O1CN01bAhaqS1WxdaE0QfbB_!!6000000002855-0-tps-875-391.jpg" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |全字段识别|智能识别营业执照上所包含的全部字段。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|企事业名称、法人代表等文字信息准确率超过95%，营业执照注册号等数字信息准确率超过98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [企业资质识别](https://common-buy.aliyun.com/?commodityCode=ocr_enterprisecard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=assets&subtype=blicense#intro)免费体验本功能识别效果。|
   * |2|购买[营业执照识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_enterprisecard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_enterprisecard_dp_cn_20211103184836_0975%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeBusinessLicense?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>请保证整张营业执照内容及其边缘包含在图像内。 </li> <li> 本能力会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   * |相关能力|<ul> <li> [云市场营业执照识别。](https://market.aliyun.com/products/57124001/cmapi013592.html?spm=5176.730005.result.41.7fc03524S3wFYv&innerSource=search_%E8%90%A5%E4%B8%9A%E6%89%A7%E7%85%A7#sku=yuncode759200000) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeBusinessLicense(
    req: RecognizeBusinessLicenseRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeBusinessLicenseResponse>;
  /**
   * 银行开户许可证识别。
   *
   * @remarks
   *
   * 银行开户许可证识别
   * #### 本接口适用场景
   *   * 阿里云银行开户许可证识别，是阿里云官方自研OCR文字识别产品，适用于识别银行开户许可证所包含的账号、核准号、企业名称、法人姓名以及开户行等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i1/O1CN01h572VA1PARjgZ1TyV_!!6000000001800-2-tps-819-316.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票据凭证识别](https://common-buy.aliyun.com/?commodityCode=ocr_invoice_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=assets&subtype=bank_account_permit#intro)免费体验本功能识别效果。|
   * |2|购买[银行开户许可证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_enterprisecard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_enterprisecard_dp_cn_20211103184836_0059%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeBankAccountLicense?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul><li>接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。</li></ul>|
   * |相关能力|<ul> <li> [云市场银行开户许可证识别。](https://market.aliyun.com/products/57124001/cmapi00042885.html?#sku=yuncode3688500001) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeBankAccountLicense(
    req: RecognizeBankAccountLicenseRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeBankAccountLicenseResponse>;
  /**
   * 商标注册证。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeTradeMarkCertification(
    req: RecognizeTradeMarkCertificationRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeTradeMarkCertificationResponse>;
  /**
   * 食品生产许可证。
   *
   * @remarks
   *
   * 食品生产许可证识别
   * #### 本接口适用场景
   *   * 阿里云食品生产许可证识别，是阿里云官方自研OCR文字识别产品。适用于识别食品生产许可证社会信用代码、发证机关、生产地址、签发日期等信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1YaMhXKT2gK0jSZFvXXXnFXXa-1414-1000.png" width="50%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [企业资质识别](https://common-buy.aliyun.com/?commodityCode=ocr_enterprisecard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=assets&subtype=food_plicense#intro)免费体验本功能识别效果。|
   * |2|购买 [企业资质识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_enterprisecard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_enterprisecard_dp_cn_20211103184836_0461%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeFoodProduceLicense?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeFoodProduceLicense(
    req: RecognizeFoodProduceLicenseRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeFoodProduceLicenseResponse>;
  /**
   * 食品经营许可证。
   *
   * @remarks
   *
   * 食品经营许可证识别
   * #### 本接口适用场景
   *   * 阿里云食品经营许可证识别，是阿里云官方自研OCR文字识别产品，适用于识别食品经营许可证上的经营者名称、法定代表人名称、社会信用代码等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *    * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1Rwa_N1H2gK0jSZJnXXaT1FXa-2060-800.jpg" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图片格式|支持PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [企业资质识别](https://common-buy.aliyun.com/?commodityCode=ocr_enterprisecard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=assets&subtype=food_blicense#intro)免费体验本功能识别效果。|
   * |2|购买[食品经营许可证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_enterprisecard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_enterprisecard_dp_cn_20211103184836_0564%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeFoodManageLicense?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |相关能力|<ul> <li> [云市场食品经营许可证识别。](https://market.aliyun.com/products/57124001/cmapi033384.html?spm=a2c4g.11186623.0.0.43f6525aYt7UN6#sku=yuncode2738400001) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeFoodManageLicense(
    req: RecognizeFoodManageLicenseRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeFoodManageLicenseResponse>;
  /**
   * 医疗器械经营许可证。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeMedicalDeviceManageLicense(
    req: RecognizeMedicalDeviceManageLicenseRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeMedicalDeviceManageLicenseResponse>;
  /**
   * 医疗器械生产许可证。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeMedicalDeviceProduceLicense(
    req: RecognizeMedicalDeviceProduceLicenseRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeMedicalDeviceProduceLicenseResponse>;
  /**
   * 第二类医疗器械经营备案凭证。
   *
   * @remarks
   *
   * 第二类医疗器械经营备案凭证识别
   * #### 本接口适用场景
   *   * 阿里云第二类医疗器械经营备案凭证识别，是阿里云官方自研OCR文字识别产品。适用于识别第二类医疗器械经营备案凭证备案编号、企业名称、经营方式、法定代表人、经营范围等信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1Hyx0MEH1gK0jSZSyXXXtlpXa-750-1000.png" width="45%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [企业资质识别](https://common-buy.aliyun.com/?commodityCode=ocr_enterprisecard_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=assets&subtype=c2_medical_device_op_record#intro)免费体验本功能识别效果。|
   * |2|购买 [企业资质识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_enterprisecard_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_enterprisecard_dp_cn_20211103184836_0131%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeCtwoMedicalDeviceManageLicense?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeCtwoMedicalDeviceManageLicense(
    req: RecognizeCtwoMedicalDeviceManageLicenseRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeCtwoMedicalDeviceManageLicenseResponse>;
  /**
   * 化妆品生产许可证识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeCosmeticProduceLicense(
    req: RecognizeCosmeticProduceLicenseRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeCosmeticProduceLicenseResponse>;
  /**
   * 国际企业执照识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeInternationalBusinessLicense(
    req: RecognizeInternationalBusinessLicenseRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeInternationalBusinessLicenseResponse>;
  /**
   * 行驶证识别。
   *
   * @remarks
   *
   * 行驶证识别
   * #### 本接口适用场景
   *   * 阿里云行驶证识别，是阿里云官方自研OCR文字识别产品，精准定位和识别行驶证正、副页所包含的关键信息，支持正副页在同一张图片的场景进行自动分割与结构化识别。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i2/O1CN01ZihUIy1bCzJiSNPrk_!!6000000003430-0-tps-1323-828.jpg" width="70%"></p>
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i2/O1CN017IZ97Q1TdzkT25B2F_!!6000000002406-0-tps-989-517.jpg" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |行驶证混贴|支持对正副页在同一张图片的场景进行自动分割与结构化识别。|
   * |高精度识别|总体准确率达93%以上。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [车辆物流识别](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=logistics&subtype=vehicle_license#intro)免费体验本功能识别效果。|
   * |2|购买[行驶证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_logistics_dp_cn_20211103160032_0739%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeVehicleLicense?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |国家与语言| <ul> <li>本接口只支持中国行驶证。</li></ul> |
   * |其他提示|<ul> <li>请保证整张行驶证内容及其边缘包含在图像内。 </li> <li> 本能力会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   * |相关能力|<ul> <li> [行驶证识别。](https://market.aliyun.com/products/57124001/cmapi011791.html?spm=5176.730005.result.13.291d3524fc1E2j&innerSource=search_%E8%A1%8C%E9%A9%B6%E8%AF%81#sku=yuncode579100000) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeVehicleLicense(
    req: RecognizeVehicleLicenseRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeVehicleLicenseResponse>;
  /**
   * 驾驶证识别。
   *
   * @remarks
   *
   * 驾驶证识别
   * #### 本接口适用场景
   *   * 阿里云驾驶证识别，是阿里云官方自研OCR文字识别产品，适用于获取驾驶证上的姓名、证号、国籍、住址、准驾类型、初次领证日期、有效期等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i4/O1CN016MD6rM1Clv8MfB6Uz_!!6000000000122-0-tps-787-431.jpg" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |全字段识别|智能识别营业执照上所包含的全部字段。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体准确率和召回率达95%以上。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [车辆物流识别](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=logistics&subtype=driving_license#intro)免费体验本功能识别效果。|
   * |2|购买[驾驶证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_logistics_dp_cn_20211103160032_0001%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeDrivingLicense?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |国家与语言| <ul> <li>本接口只支持中国驾驶证。</li></ul> |
   * |其他提示|<ul> <li>请保证整张驾驶证内容及其边缘包含在图像内。 </li> <li> 本能力会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   * |相关能力|<ul> <li> [云市场驾驶证识别。](https://market.aliyun.com/products/57002002/cmapi010402.html?spm=5176.730005.result.29.34d635246xDdY0&innerSource=search_%E9%A9%BE%E9%A9%B6%E8%AF%81) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeDrivingLicense(
    req: RecognizeDrivingLicenseRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeDrivingLicenseResponse>;
  /**
   * 电子面单识别。
   *
   * @remarks
   *
   * 电子面单识别
   * #### 本接口适用场景
   *   * 阿里云电子面单识别，是阿里云官方自研OCR文字识别产品，适用于自动提取面单上的手机号进行拨打收件人号码或发短信，减少快递员拨号时间；可快速定位面单上的所需信息，提升快递转运效率。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/7133931661/p480011.png" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |全字段识别|智能识别快递运单上所包含的全部字段。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|识别准确率可达93%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [车辆物流识别](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=logistics&subtype=waybill#intro)免费体验本功能识别效果。|
   * |2|购买[电子面单识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_logistics_dp_cn_20211103160032_0823%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeWaybill?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li> 接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。 </li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li>  </ul>|
   * |相关能力|<ul> <li> [云市场电子面单识别。](https://market.aliyun.com/products/57124001/cmapi00043511.html?spm=a2c4g.11186623.0.0.4efc4288F9Ffm7#sku=yuncode3751100001) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeWaybill(req: RecognizeWaybillRequest, opts?: AliCloudClientOptions): Promise<RecognizeWaybillResponse>;
  /**
   * 车牌识别。
   *
   * @remarks
   *
   * 车牌识别
   * #### 本接口适用场景
   *   * 阿里云车牌识别，是阿里云官方自研OCR文字识别产品，可有效识别车辆车牌信息，支持多车牌以及多类车型检测识别。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i1/O1CN01ornmBX24I8d09nFQV_!!6000000007367-0-tps-661-264.jpg" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |多地区车牌识别|浙、苏、赣、黑、鄂、川、甘、陕、吉、辽、闽、皖等。|
   * |多车型识别|大型汽车、小型汽车、新能源车、挂车、临时车牌、警车、军车、使领馆车、教练车、港澳车。|
   * |使用场景|广泛应用于车辆安防检控、车辆出入识别等场景。|
   * |高精度识别|总体准确率达93%以上。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [车辆物流识别](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=logistics&subtype=driving_license#intro)免费体验本功能识别效果。|
   * |2|购买[车牌识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_logistics_dp_cn_20211103160032_0692%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeCarNumber?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>请保证整张车牌内容及其边缘包含在图像内。 </li> <li> 本能力会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   * |相关能力|<ul> <li> [云市场车牌识别。](https://market.aliyun.com/products/57124001/cmapi020094.html?spm=5176.730005.result.17.517535242WwEyb&innerSource=search_%E8%BD%A6%E7%89%8C%E8%AF%86%E5%88%AB#sku=yuncode1409400000) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeCarNumber(req: RecognizeCarNumberRequest, opts?: AliCloudClientOptions): Promise<RecognizeCarNumberResponse>;
  /**
   * 车辆vin码识别。
   *
   * @remarks
   *
   * 车辆vin码识别
   * #### 本接口适用场景
   *   * 阿里云VIN码识别，是阿里云官方自研OCR文字识别产品，适用于识别车辆上的VIN码，用于进行车辆质检检查、车辆登记的等场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1.NXUdLzO3e4jSZFxXXaP_FXa-1600-800.jpg" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图片格式|PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [车辆物流识别](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=logistics&subtype=car_vin#intro)免费体验本功能识别效果。|
   * |2|购买[车辆vin码识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_logistics_dp_cn_20211103160032_0057%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeCarVinCode?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>请保证整张车牌内容及其边缘包含在图像内。 </li> <li> 本能力会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   * |相关能力|<ul> <li> [云市场车辆vin码识别。](https://market.aliyun.com/products/57124001/cmapi023049.html?spm=a2c4g.11186623.0.0.3ecb4288iZinrC#sku=yuncode1704900000) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeCarVinCode(
    req: RecognizeCarVinCodeRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeCarVinCodeResponse>;
  /**
   * 机动车注册登记证识别。
   *
   * @remarks
   *
   * 机动车注册登记证识别
   * #### 本接口适用场景
   *   * 阿里云机动车注册登记证识别，是阿里云官方自研OCR文字识别产品，适用于识别机动车注册证所包含的证件类型、编号、机动车所有人、登记机关、登记日期等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，在性能及效果上均处于OCR文字识别行业领先水平，已广泛应用于阿里集团及阿里云各业务。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i3/O1CN01Bi3iwu1EWT0KLLzgX_!!6000000000359-2-tps-635-368.png" width="70%"></p>
   *
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [车辆物流识别](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=logistics&subtype=vehicle_register#intro)免费体验本功能识别效果。|
   * |2|购买[车辆物流识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_logistics_dp_cn_20211222171406_0783%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeVehicleRegistration?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li> 本能力会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   * |相关能力|<ul> <li> [云市场机动车注册登记证识别。](https://market.aliyun.com/products/57124001/cmapi00038697.html?#sku=yuncode3269700001) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeVehicleRegistration(
    req: RecognizeVehicleRegistrationRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeVehicleRegistrationResponse>;
  /**
   * 车辆合格证识别。
   *
   * @remarks
   *
   * 车辆合格证识别
   * #### 本接口适用场景
   *   * 阿里云车辆合格证识别，是阿里云官方自研OCR文字识别产品，适用于识别车辆合格证所包含的车辆型号、车辆识别代号、地盘型号、发动机型号等关键信息的场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，在性能及效果上均处于OCR文字识别行业领先水平，已广泛应用于阿里集团及阿里云各业务。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i1/O1CN01myFZQ91pMyaGJpRZn_!!6000000005347-2-tps-562-316.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达97%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [车辆物流识别](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=logistics&subtype=vehicle_certificate#intro)免费体验本功能识别效果。|
   * |2|购买[车辆合格证识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_logistics_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_logistics_dp_cn_20211222171406_0433%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeVehicleCertification?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li>  </ul>|
   * |相关能力|<ul> <li> [云市场车辆合格证识别。](https://market.aliyun.com/products/57124001/cmapi00049687.html?#sku=yuncode4368700002) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeVehicleCertification(
    req: RecognizeVehicleCertificationRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeVehicleCertificationResponse>;
  /**
   * 印刷体数学公式识别。
   *
   * @remarks
   *
   * 印刷体数学公式识别
   * #### 本接口适用场景
   *   * 阿里云公式识别，是阿里云官方自研OCR文字识别产品，适用于题目录入、智能批改、作业批改等应用场景。
   *   * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   *   * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i1/O1CN01tW1cGY1U1LxDXWmtJ_!!6000000002457-2-tps-641-318.png" width="60%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [教育场景识别](https://common-buy.aliyun.com/?commodityCode=ocr_education_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=edu&subtype=math_rec#intro)免费体验本功能识别效果。|
   * |2|购买[教育场景识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_education_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_education_dp_cn_20211103164555_0495%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.html)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeEduFormula?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。</li> </ul> |
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeEduFormula(
    req: RecognizeEduFormulaRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeEduFormulaResponse>;
  /**
   * 口算判题识别。
   *
   * @remarks
   *
   * 口算判题
   * #### 本接口适用场景
   * * 阿里云口算判题识别，是阿里云官方自研OCR文字识别产品，适用于整数的加减乘除四则运算、整数的混合运算、大小比较、最大数最小数等的场景。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i1/O1CN01JwIWUI1UyR34OnMHv_!!6000000002586-2-tps-636-316.png" width="50%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达97%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [教育场景识别](https://common-buy.aliyun.com/?commodityCode=ocr_education_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=edu&subtype=kousuan#intro)免费体验本功能识别效果。|
   * |2|购买[教育场景识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_education_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_education_dp_cn_20211103164555_0373%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeEduOralCalculation?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   * |相关能力|<ul> <li> [云市场口算判题。](https://market.aliyun.com/products/57124001/cmapi00043293.html?#sku=yuncode3729300001) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeEduOralCalculation(
    req: RecognizeEduOralCalculationRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeEduOralCalculationResponse>;
  /**
   * 整页试卷识别。
   *
   * @remarks
   *
   * 整页试卷识别
   * #### 本接口适用场景
   * * 阿里云整页试卷识别，是阿里云官方自研OCR文字识别产品，适用于对练习册、教辅、教材等内容进行整页识别与题目检索场景。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i4/O1CN016bI8WV1TWfQ4ocurU_!!6000000002390-2-tps-739-450.png" width="50%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达97%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [教育场景识别](https://common-buy.aliyun.com/?commodityCode=ocr_education_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=edu&subtype=paper_ocr#intro)免费体验本功能识别效果。|
   * |2|购买[教育场景识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_education_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_education_dp_cn_20211103164555_0789%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeEduPaperOcr?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeEduPaperOcr(
    req: RecognizeEduPaperOcrRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeEduPaperOcrResponse>;
  /**
   * 试卷切题识别。
   *
   * @remarks
   *
   * 试卷切题识别
   * #### 本接口适用场景
   * * 阿里云试卷切题识别，是阿里云官方自研OCR文字识别产品，适用于识别整页练习册、试卷或教辅中的题目的场景，适用于教育材料内容的数字化生产与题库录入。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i1/O1CN01DOZA301QjXXwGP8uJ_!!6000000002012-2-tps-1030-942.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |服务|自动切题，并识别其中所包含的文字内容和坐标位置。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |适用范围广|支持K12全学科、多版式扫描版印刷体的整页切题场景。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [教育场景识别](https://common-buy.aliyun.com/?commodityCode=ocr_education_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=edu&subtype=paper_cut#intro)免费体验本功能识别效果。|
   * |2|购买[试卷切题识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_education_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_education_dp_cn_20211103164555_0194%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeEduPaperCut?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> URL长度不能超过2048。 </li>  <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   * |相关能力|<ul> <li> [云市场扫描版试卷切题识别。](https://market.aliyun.com/products/57124001/cmapi00042623.html?#sku=yuncode3662300001) </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeEduPaperCut(
    req: RecognizeEduPaperCutRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeEduPaperCutResponse>;
  /**
   * 题目识别。
   *
   * @remarks
   *
   * 题目识别
   * #### 本接口适用场景
   * * 阿里云题目识别，是阿里云官方自研OCR文字识别产品，适用于扫描、拍照changing的单题题目识别，适用于智能批改等场景的题目内容识别。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1KESJj639YK4jSZPcXXXrUFXa-1030-400.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |多文本格式|支持印刷体文本、手写体文本以及公式的OCR识别。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |返回坐标|可实现对题目中的配图位置进行检测并返回坐标位置。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [教育场景识别](https://common-buy.aliyun.com/?commodityCode=ocr_education_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=edu&subtype=question_ocr#intro)免费体验本功能识别效果。|
   * |2|购买[题目识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_education_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_education_dp_cn_20211103164555_0111%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeEduQuestionOcr?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeEduQuestionOcr(
    req: RecognizeEduQuestionOcrRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeEduQuestionOcrResponse>;
  /**
   * 精细版结构化识别。
   *
   * @remarks
   *
   * 精细版结构化切题
   * #### 本接口适用场景
   * * 阿里云精细版结构化切题，是阿里云官方自研OCR文字识别产品，适用于整页练习册、试卷或教辅种的题目场景。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i3/O1CN01XxrLu71rjXK95i1lW_!!6000000005667-2-tps-1147-626.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |智能识别|自动切题，并识别其中的全部字段和坐标位置。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [教育场景识别](https://common-buy.aliyun.com/?commodityCode=ocr_education_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=edu&subtype=paper_structured#intro)免费体验本功能识别效果。|
   * |2|购买[精细版结构化切题资源包](https://common-buy.aliyun.com/?commodityCode=ocr_education_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_education_dp_cn_20211103164555_0978%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeEduPaperStructed?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> URL长度不能超过2048。 </li>  <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeEduPaperStructed(
    req: RecognizeEduPaperStructedRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeEduPaperStructedResponse>;
  /**
   * 通用多语言识别。
   *
   * @remarks
   *
   * 通用多语言识别
   * #### 本接口适用场景
   * * 阿里云通用多语言证识别，是阿里云官方自研OCR文字识别产品，适用于国际化所需的各类图文识别与信息翻译场景。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i4/O1CN01tVz6Eh1eY0Lb3pUGZ_!!6000000003882-2-tps-640-368.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [通用文字识别](https://common-buy.aliyun.com?commodityCode=ocr_general_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=i18n&subtype=languages#intro)免费体验本功能识别效果。|
   * |2|购买[小语种识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_multilanguage_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_multilanguage_dp_cn_20211103180438_0408%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeMultiLanguage?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> <li> 图片尺寸过小，会影响识别精度。图片内单字大小在10-50px内时，识别效果较好。 </li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   * |相关能力|<ul><li>[云市场通用多语言识别。](https://market.aliyun.com/products/57124001/cmapi00040847.html?#sku=yuncode3484700001)</li></ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeMultiLanguage(
    req: RecognizeMultiLanguageRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeMultiLanguageResponse>;
  /**
   * 英语作文识别。
   *
   * @remarks
   *
   * 英语作文识别
   * #### 本接口适用场景
   * * 阿里云英语专项识别，是阿里云官方自研OCR文字识别产品，适用于全英文图片、文档场景下的英文印刷体字符的高效检测和识别。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/tfs/TB1K2a4NVY7gK0jSZKzXXaikpXa-2060-800.jpg" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |功能|具备英文专项识别和英文分词功能。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |多卡面类型|支持各种位数、凸字卡面、平面卡面的识别。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [小语种识别](https://common-buy.aliyun.com/?commodityCode=ocr_multilanguage_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=i18n&subtype=eng#intro)免费体验本功能识别效果。|
   * |2|购买[英语作文识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_multilanguage_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_multilanguage_dp_cn_20211103180438_0108%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeEnglish?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeEnglish(req: RecognizeEnglishRequest, opts?: AliCloudClientOptions): Promise<RecognizeEnglishResponse>;
  /**
   * 泰语识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeThai(req: RecognizeThaiRequest, opts?: AliCloudClientOptions): Promise<RecognizeThaiResponse>;
  /**
   * 日语识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeJanpanese(req: RecognizeJanpaneseRequest, opts?: AliCloudClientOptions): Promise<RecognizeJanpaneseResponse>;
  /**
   * 韩语识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeKorean(req: RecognizeKoreanRequest, opts?: AliCloudClientOptions): Promise<RecognizeKoreanResponse>;
  /**
   * 拉丁语识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeLatin(req: RecognizeLatinRequest, opts?: AliCloudClientOptions): Promise<RecognizeLatinResponse>;
  /**
   * 俄语识别。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeRussian(req: RecognizeRussianRequest, opts?: AliCloudClientOptions): Promise<RecognizeRussianResponse>;
  /**
   * 核酸检测报告识别。
   *
   * @remarks
   *
   * 核酸检测报告识别
   * #### 本接口适用场景
   * * 阿里云核酸检测报告识别，是阿里云官方自研OCR文字识别产品，适用于识别核酸检测报告上的姓名、证件号码、采样时间、检测结果等关键信息的场景。
   * * 阿里云OCR产品基于阿里巴巴达摩院强大的AI技术及海量数据，历经多年沉淀打磨，具有服务稳定、操作简易、实时性高、能力全面等几大优势。
   * * 本接口图片示例
   * <p style="text-align:center"><img src="https://img.alicdn.com/imgextra/i2/O1CN01qWUm4s1kF7eX52tJy_!!6000000004653-2-tps-1921-831.png" width="70%"></p>
   *
   * #### 本接口核心能力
   *
   * |分类 |概述|
   * |---|---------|
   * |图片格式|支持PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。|
   * |图像增强|默认支持图像增强，包括图像自动旋转、畸变自动矫正、模糊图片自动增强等能力。|
   * |多类型覆盖|支持模糊、光照不均、透视畸变、任意背景等低质量图像识别。|
   * |高精度识别|总体识别准确率可达98%。|
   *
   * #### 如何使用本接口
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [医疗场景识别](https://common-buy.aliyun.com/?commodityCode=ocr_medical_public_cn) 服务。开通服务前后，您可以通过[体验馆](https://duguang.aliyun.com/experience?type=medicalCare&subtype=covid_test_report#intro)免费体验本功能识别效果。|
   * |2|购买[核酸检测报告识别资源包](https://common-buy.aliyun.com/?commodityCode=ocr_medical_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_medical_dp_cn_20220506154332_0030%22,%22flowout_spec%22:%22500%22%7D)。本API会赠送免费额度，可使用免费额度测试。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/RecognizeCovidTestReport?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * #### 重要提示
   * |类型|概述|
   * |----|-------------------|
   * |图片格式|<ul> <li>本接口支持：PNG、JPG、JPEG、BMP、GIF、TIFF、WebP。暂不支持PDF格式。</li></ul>|
   * |图片尺寸|<ul> <li> 图片长宽需要大于15像素，小于8192像素。</li> <li>长宽比需要小于50。</li> <li>如需达到较好识别效果，建议长宽均大于500px。</li> </ul>|
   * |图片大小|<ul> <li> 图片二进制文件不能超过10MB。</li> <li> 图片过大会影响接口响应速度，建议使用小于1.5M图片进行识别，且通过传图片URL的方式调用接口。</li> </ul>|
   * |其他提示|<ul> <li>接口响应速度和图片中的文字数量有关，如果图片中文字数量越多，接口响应可能越慢。</li> <li> 接口会自动处理反光、扭曲等干扰信息，但会影响精度。请尽量选择清晰度高、无反光、无扭曲的图片。 </li> </ul>|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  RecognizeCovidTestReport(
    req: RecognizeCovidTestReportRequest,
    opts?: AliCloudClientOptions,
  ): Promise<RecognizeCovidTestReportResponse>;
  /**
   * 营业执照三要素核验支持通过输入营业执照的统一信用社会代码（工商注册号）、企业名称、法人姓名做一致性验证。
   *
   * @remarks
   *
   * 营业执照核验
   * #### 如何开通/购买本服务
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票证核验](https://common-buy.aliyun.com/?spm=5176.28059030.0.0.68c21287dXK0hR&commodityCode=ocr_cardverification_public_cn) 服务。开通后您可享50次免费额度。|
   * |2|购买[营业执照核验资源包](https://common-buy.aliyun.com/?commodityCode=ocr_cardverification_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_cardverification_dp_cn_20220826134917_0698%22,%22flowout_spec%22:%221000%22%7D%E3%80%91)。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.htm?spm=a2c4g.11186623.0.0.22878a21R9tkuV)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/VerifyBusinessLicense?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  VerifyBusinessLicense(
    req: VerifyBusinessLicenseRequest,
    opts?: AliCloudClientOptions,
  ): Promise<VerifyBusinessLicenseResponse>;
  /**
   * 发票核验接口支持包括：增值税专用发票、增值税普通发票（折叠票）、增值税普通发票（卷票）、增值税电子普通发票（含收费公路通行费增值税电子普通发票）、机动车销售统一发票、二手车销售统一发票多种类型发票核验。您可以通过输入发票的关键验证字段，返回真实的票面信息，包括发票类型、发票代码、发票号码、作废标志、开票日期、购方税号及其他发票信息等。当天开具发票当日可查验（T+0）。注意：可能有几小时到十几小时的延迟。
   *
   * @remarks
   *
   * 发票核验
   * #### 如何开通/购买本服务
   *
   * |步骤|概述|
   * |--|---|
   * |1|开通 [票证核验](https://common-buy.aliyun.com/?spm=5176.28059030.0.0.68c21287dXK0hR&commodityCode=ocr_cardverification_public_cn) 服务。开通后您可享50次免费额度。|
   * |2|购买[发票核验资源包](https://common-buy.aliyun.com/?commodityCode=ocr_cardverification_dp_cn&request=%7B%22ord_time%22:%221:Year%22,%22order_num%22:1,%22pack%22:%22ocr_cardverification_dp_cn_20220830140650_0595%22,%22flowout_spec%22:%221000%22%7D)。您也可以不购买资源包，系统会通过“[按量付费](https://help.aliyun.com/document_detail/295347.htm?spm=a2c4g.11186623.0.0.22878a21R9tkuV)”方式按实际调用量自动扣款。|
   * |3|可以参照[调试页面](https://next.api.aliyun.com/api/ocr-api/2021-07-07/VerifyVATInvoice?sdkStyle=dara)提供的代码示例完成API接入开发。接入完成后，调用API获取识别结果。如果使用子账号调用接口，需要阿里云账号（主账号）对RAM账号进行授权。创建RAM用户的具体操作，请参考：[创建RAM用户。](https://help.aliyun.com/document_detail/93720.html)文字识别服务提供一种系统授权策略，即**AliyunOCRFullAccess**。具体授权操作，请参见[在用户页面为RAM用户授权。](https://help.aliyun.com/document_detail/116146.html)|
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  VerifyVATInvoice(req: VerifyVATInvoiceRequest, opts?: AliCloudClientOptions): Promise<VerifyVATInvoiceResponse>;
}
export interface RecognizeAdvancedRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否输出单字识别结果
   * * 是否输出单字识别结果，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  OutputCharInfo?: boolean;
  /**
   * 是否需要自动旋转功能(结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置)，返回角度信息
   * * 是否需要自动旋转功能，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  NeedRotate?: boolean;
  /**
   * 是否输出表格识别结果，包含单元格信息
   * * 是否输出表格识别结果，包含单元格信息，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  OutputTable?: boolean;
  /**
   * 是否按顺序输出文字块。false表示从左往右，从上到下的顺序；true表示从上到下，从左往右的顺序
   * * 是否按顺序输出文字块，默认为false。
   * * false表示从左往右，从上到下的顺序；true表示从上到下，从左往右的顺序。
   * @acs-in query
   */
  NeedSortPage?: boolean;
  /**
   * 是否需要图案检测功能，默认不需要。true：需要 false：不需要
   * * 是否需要图案检测功能，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  OutputFigure?: boolean;
  /**
   * 是否需要去除印章功能，默认不需要。true：需要 false：不需要
   * * 是否需要去除印章功能，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  NoStamp?: boolean;
  /**
   * 是否需要分段功能，默认不需要。true：需要 false：不需要
   * * 是否需要分段功能，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  Paragraph?: boolean;
  /**
   * 是否需要成行返回功能，默认不需要
   * * 是否需要成行返回功能，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  Row?: boolean;
}
export type RecognizeAdvancedResponse = string | object;
export interface RecognizeHandwritingRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否输出单字识别结果
   * * 是否输出单字识别结果，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  OutputCharInfo?: boolean;
  /**
   * 是否需要自动旋转功能(结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置)，返回角度信息
   * * 是否需要自动旋转功能，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  NeedRotate?: boolean;
  /**
   * 是否输出表格识别结果，包含单元格信息
   * * 是否输出表格识别结果，包含单元格信息，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  OutputTable?: boolean;
  /**
   * 是否按顺序输出文字块。false表示从左往右，从上到下的顺序；true表示从上到下，从左往右的顺序
   * * 是否按顺序输出文字块，默认为false。
   * * false表示从左往右，从上到下的顺序；true表示从上到下，从左往右的顺序。
   * @acs-in query
   */
  NeedSortPage?: boolean;
}
export type RecognizeHandwritingResponse = string | object;
export interface RecognizeBasicRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeBasicResponse = string | object;
export interface RecognizeGeneralRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeGeneralResponse = string | object;
export interface RecognizeTableOcrRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否需要自动旋转功能，默认需要
   * * 是否需要自动旋转功能，默认需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  NeedRotate?: boolean;
  /**
   * 是否无线条
   * * 是否无线条或者只有横线没有竖线,默认无线条。
   * * true：无线条；false：有线条。
   * @acs-in query
   */
  LineLess?: boolean;
  /**
   * 是否跳过表格识别，如果没有检测到表格，可以设置"skip_detection":true
   * * 是否跳过检测，默认为false。
   * * true：跳过检查；false：跳过检查。
   * @acs-in query
   */
  SkipDetection?: boolean;
  /**
   * * 是否是手写表格，默认不是。
   * * true：是手写表格；false：不是手写表格。
   * * 注意：该字段是字符串类型。
   * @acs-in query
   */
  IsHandWriting?: string;
}
export type RecognizeTableOcrResponse = string | object;
export interface RecognizeHealthCodeRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeHealthCodeResponse = string | object;
export interface RecognizeDocumentStructureRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制文件，最大10MB，与URL二选一。
   * 使用HTTP方式调用，把图片二进制文件放到HTTP body 中上传即可。
   * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否需要自动旋转功能(结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置)，返回角度信息
   * 是否需要自动旋转功能，返回角度信息。默认不需要。true：需要 false：不需要。
   * @acs-in query
   */
  NeedRotate?: boolean;
  /**
   * 是否输出单字识别结果
   * 是否输出单字识别结果，默认不需要。true：需要 false：不需要。
   * 当UseNewStyleOutput=true时，此参数不生效。
   * @acs-in query
   */
  OutputCharInfo?: boolean;
  /**
   * 是否输出表格识别结果，包含单元格信息
   * 是否输出表格识别结果，包含单元格信息。默认不需要。true：需要 false：不需要。
   * @acs-in query
   */
  OutputTable?: boolean;
  /**
   * 是否按顺序输出文字块。false表示从左往右，从上到下的顺序；true表示从上到下，从左往右的顺序
   * 是否按顺序输出文字块，默认不需要。true：需要 false：不需要。false表示从左往右，从上到下的顺序；true表示从上到下，从左往右的顺序。
   * 当UseNewStyleOutput=true时，此参数不生效。
   * @acs-in query
   */
  NeedSortPage?: boolean;
  /**
   * 是否需要分页功能，默认不需要。 true：需要 false：不需要
   * 是否需要分页功能，默认不需要。 true：需要 false：不需要。
   * 当UseNewStyleOutput=true时，此参数不生效。
   * @acs-in query
   */
  Page?: boolean;
  /**
   * 是否需要去除印章功能，默认不需要。true：需要 false：不需要
   * 是否需要去除印章功能，默认不需要。true：需要 false：不需要
   * @acs-in query
   */
  NoStamp?: boolean;
  /**
   * 是否需要分段功能，默认不需要。true：需要 false：不需要
   * 是否需要分段功能，默认不需要。true：需要 false：不需要。
   * 当UseNewStyleOutput=true时，此参数不生效。
   * @acs-in query
   */
  Paragraph?: boolean;
  /**
   * 是否需要成行返回功能，默认不需要。true：需要 false：不需要
   * 是否需要成行返回功能，默认不需要。true：需要 false：不需要。
   * 当UseNewStyleOutput=true时，此参数不生效。
   * @acs-in query
   */
  Row?: boolean;
  /**
   * 是否返回新版格式输出
   * 是否返回新版格式输出，默认为false
   * @acs-in query
   */
  UseNewStyleOutput?: boolean;
}
export type RecognizeDocumentStructureResponse = string | object;
export interface RecognizeIdcardRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否需要图案检测功能，默认不需要
   * * 是否需要图案检测功能，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  OutputFigure?: boolean;
  /**
   * 是否需要输出身份证质量检测信息
   * * 是否需要身份证质量检测功能，默认不需要。
   * * 身份证质量检测功能包含：是否翻拍，是否是复印件，完整度评分，整体质量分数、篡改指数。
   * * 注意：如果需要设置此参数，请使用最新版本SDK。如果不需要设置此参数，您无需更新SDK。
   * @acs-in query
   */
  OutputQualityInfo?: boolean;
}
export type RecognizeIdcardResponse = RecognizeIdcardRoot;
export interface RecognizePassportRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizePassportResponse = string | object;
export interface RecognizeHouseholdRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * * 是否是户口本常住人口页，默认为否。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  IsResidentPage?: boolean;
}
export type RecognizeHouseholdResponse = string | object;
export interface RecognizeEstateCertificationRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和BODY字段二选一，不可同时透传或同时为空。
   *   * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   *   * 图片二进制文件，最大10MB。
   *   * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   *   * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeEstateCertificationResponse = string | object;
export interface RecognizeBankCardRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeBankCardResponse = string | object;
export interface RecognizeBirthCertificationRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeBirthCertificationResponse = string | object;
export interface RecognizeChinesePassportRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制字节流，最大10MB
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否需要图案检测功能，默认需要
   * 是否需要图案检测功能，默认需要
   * @acs-in query
   */
  OutputFigure?: boolean;
}
export type RecognizeChinesePassportResponse = string | object;
export interface RecognizeExitEntryPermitToMainlandRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 图案坐标信息输出，针对结构化，如身份证人脸头像
   * * 是否需要图案检测功能，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  OutputFigure?: boolean;
}
export type RecognizeExitEntryPermitToMainlandResponse = string | object;
export interface RecognizeExitEntryPermitToHKRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制字节流，最大10MB
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 图案坐标信息输出，针对结构化，如身份证人脸头像
   * 图案坐标信息输出，针对结构化，如身份证人脸头像
   * @acs-in query
   */
  OutputFigure?: boolean;
}
export type RecognizeExitEntryPermitToHKResponse = string | object;
export interface RecognizeHKIdcardRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeHKIdcardResponse = string | object;
export interface RecognizeSocialSecurityCardVersionIIRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeSocialSecurityCardVersionIIResponse = string | object;
export interface RecognizeInternationalIdcardRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和BODY字段二选一，不可同时透传或同时为空。
   *   * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   *   * 图片二进制文件，最大10MB。
   *   * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   *   * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 国家名称
   * * 国家名称。
   *   * 如：India，Vietnam，Korea，Bangladesh。
   * @acs-in query
   */
  Country: string;
}
export type RecognizeInternationalIdcardResponse = string | object;
export interface RecognizeMixedInvoicesRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * * 待识别的PDF/OFD页码。
   * * 如果字段为空，或大于PDF/OFD总页数，则识别第一页。
   * * 使用SDK设置此字段，请更新SDK版本。
   * @acs-in query
   */
  PageNo?: number;
}
export type RecognizeMixedInvoicesResponse = string | object;
export interface RecognizeInvoiceRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * * 指定识别的PDF/OFD页码；例如：pageNo=6，识别PDF/OFD的第六页。
   * * 如果该参数为空，或传值大于PDF/OFD总页数，则识别PDF/OFD的第一页。
   * * 如果使用SDK设置此参数，请更新SDK版本，该参数在SDK版本1.1.16开始支持。
   * @acs-in query
   */
  PageNo?: number;
}
export type RecognizeInvoiceResponse = string | object;
export interface RecognizeCarInvoiceRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeCarInvoiceResponse = string | object;
export interface RecognizeQuotaInvoiceRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制文件，最大10MB，与URL二选一。 使用HTTP方式调用，把图片二进制文件放到HTTP body 中上传即可。 使用SDK的方式调用，把图片放到SDK的body中即可
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeQuotaInvoiceResponse = string | object;
export interface RecognizeAirItineraryRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeAirItineraryResponse = string | object;
export interface RecognizeTrainInvoiceRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeTrainInvoiceResponse = string | object;
export interface RecognizeTaxiInvoiceRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeTaxiInvoiceResponse = string | object;
export interface RecognizeRollTicketRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制文件，最大10MB，与URL二选一。 使用HTTP方式调用，把图片二进制文件放到HTTP body 中上传即可。 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeRollTicketResponse = string | object;
export interface RecognizeBankAcceptanceRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   *   * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeBankAcceptanceResponse = string | object;
export interface RecognizeBusShipTicketRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制字节流，最大10MB
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeBusShipTicketResponse = string | object;
export interface RecognizeNonTaxInvoiceRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeNonTaxInvoiceResponse = string | object;
export interface RecognizeCommonPrintedInvoiceRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制字节流，最大10MB
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeCommonPrintedInvoiceResponse = string | object;
export interface RecognizeHotelConsumeRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制字节流，最大10MB
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeHotelConsumeResponse = string | object;
export interface RecognizePaymentRecordRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizePaymentRecordResponse = string | object;
export interface RecognizePurchaseRecordRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * * 是否需要识别多条订单，默认不需要。
   * * true：需要；false：不需要。
   * * 如果需要使用此参数，请更新SDK到1.1.14或更高版本。
   * * 注意：如果此参数设置为true，返回结果字段会变化。
   * @acs-in query
   */
  OutputMultiOrders?: boolean;
}
export type RecognizePurchaseRecordResponse = string | object;
export interface RecognizeRideHailingItineraryRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制字节流，最大10MB
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeRideHailingItineraryResponse = string | object;
export interface RecognizeShoppingReceiptRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制字节流，最大10MB
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeShoppingReceiptResponse = string | object;
export interface RecognizeSocialSecurityCardRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制字节流，最大10MB
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeSocialSecurityCardResponse = string | object;
export interface RecognizeTollInvoiceRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制字节流，最大10MB
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeTollInvoiceResponse = string | object;
export interface RecognizeTaxClearanceCertificateRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeTaxClearanceCertificateResponse = string | object;
export interface RecognizeUsedCarInvoiceRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制字节流，最大10MB
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeUsedCarInvoiceResponse = string | object;
export interface RecognizeBusinessLicenseRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeBusinessLicenseResponse = string | object;
export interface RecognizeBankAccountLicenseRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeBankAccountLicenseResponse = string | object;
export interface RecognizeTradeMarkCertificationRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制文件，最大10MB，与URL二选一。 使用HTTP方式调用，把图片二进制文件放到HTTP body 中上传即可。 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeTradeMarkCertificationResponse = string | object;
export interface RecognizeFoodProduceLicenseRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeFoodProduceLicenseResponse = string | object;
export interface RecognizeFoodManageLicenseRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeFoodManageLicenseResponse = string | object;
export interface RecognizeMedicalDeviceManageLicenseRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制文件，最大10MB，与URL二选一。 使用HTTP方式调用，把图片二进制文件放到HTTP body 中上传即可。 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeMedicalDeviceManageLicenseResponse = string | object;
export interface RecognizeMedicalDeviceProduceLicenseRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制文件，最大10MB，与URL二选一。 使用HTTP方式调用，把图片二进制文件放到HTTP body 中上传即可。 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeMedicalDeviceProduceLicenseResponse = string | object;
export interface RecognizeCtwoMedicalDeviceManageLicenseRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeCtwoMedicalDeviceManageLicenseResponse = string | object;
export interface RecognizeCosmeticProduceLicenseRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制字节流，最大10MB
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeCosmeticProduceLicenseResponse = string | object;
export interface RecognizeInternationalBusinessLicenseRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片/PDF 链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片/PDF二进制字节流，最大10M
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 国家名称
   * 国家名称
   * @acs-in query
   */
  Country: string;
}
export type RecognizeInternationalBusinessLicenseResponse = string | object;
export interface RecognizeVehicleLicenseRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeVehicleLicenseResponse = string | object;
export interface RecognizeDrivingLicenseRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeDrivingLicenseResponse = string | object;
export interface RecognizeWaybillRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeWaybillResponse = string | object;
export interface RecognizeCarNumberRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeCarNumberResponse = string | object;
export interface RecognizeCarVinCodeRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeCarVinCodeResponse = string | object;
export interface RecognizeVehicleRegistrationRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeVehicleRegistrationResponse = string | object;
export interface RecognizeVehicleCertificationRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeVehicleCertificationResponse = string | object;
export interface RecognizeEduFormulaRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeEduFormulaResponse = string | object;
export interface RecognizeEduOralCalculationRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
}
export type RecognizeEduOralCalculationResponse = string | object;
export interface RecognizeEduPaperOcrRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 图片类型
   * * 图片类型。
   * * scan：扫描图， photo：实拍图。
   * @acs-in query
   */
  ImageType: string;
  /**
   * 年级学科
   * * 年级学科。
   * * default:默认, Math:数学, PrimarySchool_Math:小学数学, JHighSchool_Math: 初中数学, Chinese:语文, PrimarySchool_Chinese:小学语文, JHighSchool_Chinese:初中语文, English:英语, PrimarySchool_English:小学英语, JHighSchool_English:初中英语, Physics:物理, JHighSchool_Physics:初中物理, Chemistry: 化学, JHighSchool_Chemistry:初中化学, Biology:生物, JHighSchool_Biology:初中生物, History:历史, JHighSchool_History:初中历史, Geography:地理, JHighSchool_Geography:初中地理, Politics:政治, JHighSchool_Politics:初中政治。
   * @acs-in query
   */
  Subject?: string;
  /**
   * 是否输出原图坐标信息(如果图片被做过旋转，图片校正等处理)
   * * 是否输出原图坐标信息（如果图片被做过旋转，图片校正等处理），默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  OutputOricoord?: boolean;
}
export type RecognizeEduPaperOcrResponse = string | object;
export interface RecognizeEduPaperCutRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 切题类型
   * * 切题类型。
   * * question：题目， answer：答案。
   * @acs-in query
   */
  CutType: string;
  /**
   * 图片类型
   * * 图片类型。
   * * scan：扫描图， photo：实拍图。
   * @acs-in query
   */
  ImageType: string;
  /**
   * 年级学科
   * * 年级学科。
   * * default:默认, Math:数学, PrimarySchool_Math:小学数学, JHighSchool_Math: 初中数学, Chinese:语文, PrimarySchool_Chinese:小学语文, JHighSchool_Chinese:初中语文, English:英语, PrimarySchool_English:小学英语, JHighSchool_English:初中英语, Physics:物理, JHighSchool_Physics:初中物理, Chemistry: 化学, JHighSchool_Chemistry:初中化学, Biology:生物, JHighSchool_Biology:初中生物, History:历史, JHighSchool_History:初中历史, Geography:地理, JHighSchool_Geography:初中地理, Politics:政治, JHighSchool_Politics:初中政治。
   * @acs-in query
   */
  Subject?: string;
}
export type RecognizeEduPaperCutResponse = string | object;
export interface RecognizeEduQuestionOcrRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和BODY字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否需要自动旋转功能(结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置)，返回角度信息
   * * 是否需要自动旋转功能，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  NeedRotate?: boolean;
}
export type RecognizeEduQuestionOcrResponse = string | object;
export interface RecognizeEduPaperStructedRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 学科类型
   * * 年级学科。
   * * default:默认, Math:数学, PrimarySchool_Math:小学数学, JHighSchool_Math: 初中数学, Chinese:语文, PrimarySchool_Chinese:小学语文, JHighSchool_Chinese:初中语文, English:英语, PrimarySchool_English:小学英语, JHighSchool_English:初中英语, Physics:物理, JHighSchool_Physics:初中物理, Chemistry: 化学, JHighSchool_Chemistry:初中化学, Biology:生物, JHighSchool_Biology:初中生物, History:历史, JHighSchool_History:初中历史, Geography:地理, JHighSchool_Geography:初中地理, Politics:政治, JHighSchool_Politics:初中政治。
   * @acs-in query
   */
  Subject?: string;
  /**
   * 是否需要自动旋转功能(结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置)，返回角度信息
   * * 是否需要自动旋转功能，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  NeedRotate?: boolean;
}
export type RecognizeEduPaperStructedResponse = string | object;
export interface RecognizeMultiLanguageRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 识别语种
   * * 支持语言列表。
   * @acs-in query
   */
  Languages: Array</** * chn：中文，eng：英文，ja：日文，lading：拉丁，kor：韩文，sx：手写，tai：泰文，rus：俄文，mys：马来文，idn：印尼文，viet：越南文，ukr：乌克兰文，tur：土耳其文，tamil：泰米尔文。
   * 其中**lading**支持以下语言：葡萄牙语、意大利语、德语、法语、西班牙语。 */ string>;
  /**
   * 是否输出单字识别结果
   * * 是否输出单字识别结果，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  OutputCharInfo?: boolean;
  /**
   * 是否需要自动旋转功能(结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置)，返回角度信息
   * * 是否需要自动旋转功能，默认需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  NeedRotate?: boolean;
  /**
   * 是否输出表格识别结果，包含单元格信息
   * * 是否输出表格识别结果，包含单元格信息，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  OutputTable?: boolean;
  /**
   * 是否按顺序输出文字块。false表示从左往右，从上到下的顺序；true表示从上到下，从左往右的顺序
   * * 是否按顺序输出文字块，默认为false。
   * * false表示从左往右，从上到下的顺序；true表示从上到下，从左往右的顺序。
   * @acs-in query
   */
  NeedSortPage?: boolean;
}
export type RecognizeMultiLanguageResponse = string | object;
export interface RecognizeEnglishRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否需要自动旋转功能(结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置)，返回角度信息
   * * 是否需要自动旋转功能，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  NeedRotate?: boolean;
  /**
   * 是否输出表格识别结果，包含单元格信息
   * * 是否输出表格识别结果，包含单元格信息，默认不需要。
   * * true：需要；false：不需要。
   * @acs-in query
   */
  OutputTable?: boolean;
}
export type RecognizeEnglishResponse = string | object;
export interface RecognizeThaiRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制文件，最大10MB，与URL二选一。 使用HTTP方式调用，把图片二进制文件放到HTTP body 中上传即可。 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否输出单字识别结果
   * 是否输出单字识别结果
   * @acs-in query
   */
  OutputCharInfo?: boolean;
  /**
   * 是否需要自动旋转功能(结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置)，返回角度信息
   * 是否需要自动旋转功能（结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置），返回角度信息
   * @acs-in query
   */
  NeedRotate?: boolean;
  /**
   * 是否输出表格识别结果，包含单元格信息
   * 是否输出表格识别结果，包含单元格信息
   * @acs-in query
   */
  OutputTable?: boolean;
}
export type RecognizeThaiResponse = string | object;
export interface RecognizeJanpaneseRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制文件，最大10MB，与URL二选一。 使用HTTP方式调用，把图片二进制文件放到HTTP body 中上传即可。 使用SDK的方式调用，把图片放到SDK的body中即可
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否输出单字识别结果
   * 是否输出单字识别结果
   * @acs-in query
   */
  OutputCharInfo?: boolean;
  /**
   * 是否需要自动旋转功能(结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置)，返回角度信息
   * 是否需要自动旋转功能（结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置），返回角度信息
   * @acs-in query
   */
  NeedRotate?: boolean;
  /**
   * 是否输出表格识别结果，包含单元格信息
   * 是否输出表格识别结果，包含单元格信息
   * @acs-in query
   */
  OutputTable?: boolean;
}
export type RecognizeJanpaneseResponse = string | object;
export interface RecognizeKoreanRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制文件，最大10MB，与URL二选一。 使用HTTP方式调用，把图片二进制文件放到HTTP body 中上传即可。 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否输出单字识别结果
   * 是否输出单字识别结果
   * @acs-in query
   */
  OutputCharInfo?: boolean;
  /**
   * 是否需要自动旋转功能(结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置)，返回角度信息
   * 是否需要自动旋转功能（结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置），返回角度信息
   * @acs-in query
   */
  NeedRotate?: boolean;
  /**
   * 是否输出表格识别结果，包含单元格信息
   * 是否输出表格识别结果，包含单元格信息
   * @acs-in query
   */
  OutputTable?: boolean;
}
export type RecognizeKoreanResponse = string | object;
export interface RecognizeLatinRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制文件，最大10MB，与URL二选一。 使用HTTP方式调用，把图片二进制文件放到HTTP body 中上传即可。 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否输出单字识别结果
   * 是否输出单字识别结果
   * @acs-in query
   */
  OutputCharInfo?: boolean;
  /**
   * 是否需要自动旋转功能(结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置)，返回角度信息
   * 是否需要自动旋转功能（结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置），返回角度信息
   * @acs-in query
   */
  NeedRotate?: boolean;
  /**
   * 是否输出表格识别结果，包含单元格信息
   * 是否输出表格识别结果，包含单元格信息
   * @acs-in query
   */
  OutputTable?: boolean;
}
export type RecognizeLatinResponse = string | object;
export interface RecognizeRussianRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * 图片链接（长度不超 2048，不支持 base64）
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * 图片二进制文件，最大10MB，与URL二选一。 使用HTTP方式调用，把图片二进制文件放到HTTP body 中上传即可。 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * 是否输出单字识别结果
   * 是否输出单字识别结果
   * @acs-in query
   */
  OutputCharInfo?: boolean;
  /**
   * 是否需要自动旋转功能(结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置)，返回角度信息
   * 是否需要自动旋转功能（结构化检测、混贴场景、教育相关场景会自动做旋转，无需设置），返回角度信息
   * @acs-in query
   */
  NeedRotate?: boolean;
  /**
   * 是否输出表格识别结果，包含单元格信息
   * 是否输出表格识别结果，包含单元格信息
   * @acs-in query
   */
  OutputTable?: boolean;
}
export type RecognizeRussianResponse = string | object;
export interface RecognizeCovidTestReportRequest {
  /**
   * 图片链接（长度不超 2048，不支持 base64）
   * * 本字段和body字段二选一，不可同时透传或同时为空。
   * * 图片链接（长度不超2048，不支持base64）。
   * @acs-in query
   */
  Url?: string;
  /**
   * 图片二进制字节流，最大10MB
   * * 本字段和URL字段二选一，不可同时透传或同时为空。
   * * 图片二进制文件，最大10MB。
   * * 使用HTTP方式调用，把图片二进制文件放到HTTP body中上传即可。
   * * 使用SDK的方式调用，把图片放到SDK的body中即可。
   * @acs-in body
   */
  body?: string | BufferSource;
  /**
   * * 当一张图有多个子图时，是否要返回多个识别结果,默认不需要。
   * * true：返回所有子图识别结果；false：返回检测日期最新的一个结果。
   * @acs-in query
   */
  MultipleResult?: boolean;
}
export type RecognizeCovidTestReportResponse = string | object;
export interface VerifyBusinessLicenseRequest {
  /**
   * 工商注册号/统一社会信用代码
   * 企业注册号或统一社会信用代码
   * @acs-in query
   */
  CreditCode: string;
  /**
   * 企业名称
   * 企业名称
   * @acs-in query
   */
  CompanyName: string;
  /**
   * 企业法人姓名
   * 企业法人姓名
   * @acs-in query
   */
  LegalPerson: string;
}
export interface VerifyBusinessLicenseResponse {
  /**
   * 请求唯一 ID
   */
  RequestId?: string;
  /**
   * 返回数据
   */
  Data?: string;
}
export interface VerifyVATInvoiceRequest {
  /**
   * 发票代码。数电发票（发票类型代码为31，32）时可为空（发票类型代码见**发票类型代码说明**）
   * @acs-in query
   */
  InvoiceCode?: string;
  /**
   * 发票号码。
   * @acs-in query
   */
  InvoiceNo: string;
  /**
   * 开票日期（日期格式为：YYYYMMDD）。
   * @acs-in query
   */
  InvoiceDate: string;
  /**
   * 发票类型代码为 01，03，15，20，31，32 时必填：为 01，03，20 时填写发票**不含税金额**；为 15 时填写发票**车价合计**；为 31，32 时填写**含税金额**。
   * 其它类型可为空（详见**发票类型代码说明**）。
   * @acs-in query
   */
  InvoiceSum?: string;
  /**
   * 机器验证码，取**后6位**。发票类型代码为 04，10，11，14 时必填，其他发票种类可为空（详见**发票类型代码说明**）。
   * @acs-in query
   */
  VerifyCode?: string;
}
export interface VerifyVATInvoiceResponse {
  /**
   * 请求唯一 ID
   */
  RequestId?: string;
  /**
   * 返回数据
   */
  Data?: string;
}
