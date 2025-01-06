export interface ExampleSchema {
  code: number;
  message: string;
  data: {
    title?: string;
    sceneType?: number;
    /**
     * 开始时间
     */
    startAt?: string;
    /**
     * 结束时间
     */
    finishAt?: string;
    /**
     * 视频时长
     */
    duration?: string;
    coverUrl?: string;
    playVo?: {
      mp4?: {
        sd?: string;
        hd?: string;
      };
      hls?: {
        sd?: string;
        hd?: string;
      };
    };
    /**
     * 原片和合成片合集
     */
    videoShowVOS?: {
      title?: string;
      saveType?: number;
      duration?: number;
      fileFormat?: string;
      videoUrl?: string;
    }[];
    /**
     * 讲者列表
     */
    liveSpeakerVOS?: {
      id?: string;
      liveId?: string;
      productTagName?: string;
      orgGrade?: string;
      platformGrade?: string;
      titleCertifyImgVo?: {
        imageName?: string;
        normal?: string;
        middle?: string;
        small?: string;
        gif?: string;
        nologo?: string;
      };
      doctorId?: string;
      name?: string;
      titleName?: string;
      hospital?: string;
      fee?: number;
      reviewStatus?: number;
      firstPushAt?: string;
      lastCutOffAt?: string;
      remark?: string;
      isAllowManualFee?: boolean;
      department?: string;
    }[];
    /**
     * 组织名称
     */
    orgName?: string;
    /**
     * 备注
     */
    remark?: string;
    /**
     * 审核直播异常项
     */
    liveExceptionList?: string[];
    /**
     * 身份证
     */
    idCardNo?: string;
    /**
     * 年龄
     */
    age?: number;
    /**
     * 实名认证照片
     */
    faceRecordImg?: string;
    /**
     * 合规推流场次列表
     */
    complianceLivePushVOList?: {
      complianceType?: number;
      isCompliance?: boolean;
      livePushList?: {
        liveId?: string;
        sceneType?: number;
        title?: string;
        pushAt?: string;
        cutOffAt?: string;
        reviewStatus?: number;
        playVo?: {
          mp4?: {
            sd?: string;
            hd?: string;
          };
          hls?: {
            sd?: string;
            hd?: string;
          };
        };
        titleName?: string;
      }[];
    }[];
    /**
     * 同时直播多场违规列表
     */
    sameTimeNotValidPushList?: {
      liveId?: string;
      sceneType?: number;
      title?: string;
      pushAt?: string;
      cutOffAt?: string;
      reviewStatus?: number;
      playVo?: {
        mp4?: {
          sd?: string;
          hd?: string;
        };
        hls?: {
          sd?: string;
          hd?: string;
        };
      };
      titleName?: string;
    }[];
    /**
     * 公司管控： 0  单产品线管控 :1
     */
    controlType?: number;
    /**
     * 管控内容
     */
    controlContent?: string;
    /**
     * 该讲者该讲者通过审核单日场次
     */
    dayHighest?: number & string;
    /**
     * 该讲者通过审核单月场次
     */
    monthHighest?: number & string;
    /**
     * 该讲者通过审核年场次
     */
    yearHighest?: number & string;
    /**
     * 该讲者该讲者通过审核最多单日场次
     */
    maxDayHighest?: number & string;
    /**
     * 该讲者通过审核最多单月场次
     */
    maxMonthHighest?: number & string;
    /**
     * 该讲者通过审核最多年场次
     */
    maxYearHighest?: number & string;
    /**
     * 日场次合规
     */
    dayCountFlag?: boolean & string;
    /**
     * 月场次合规
     */
    monthCountFlag?: boolean & string;
    /**
     * 直播是否存在异常
     */
    exceptionFlag?: boolean & string;
    /**
     * 当前用户可审核
     */
    isExamine?: boolean & string;
    /**
     * 当前用户是否领导
     */
    isLeader?: boolean & string;
    /**
     * 工单审核人id
     */
    reviewerId?: string;
    /**
     * 工单审核人姓名
     */
    reviewerName?: string;
    /**
     * 历史审核记录
     */
    liveSpeakerModifyRecordList?: {
      /**
       * 审核记录id
       */
      id?: number;
      /**
       * 直播ID
       */
      liveId?: string;
      /**
       * 用户ID
       */
      userId?: string;
      /**
       * 讲者审核ID
       */
      liveSpeakerId?: string;
      /**
       * 课件Id
       */
      liveCoursewareId?: string;
      /**
       * 提交时间
       */
      submitTime?: string;
      /**
       * 提交人ID
       */
      submitUserId?: string;
      /**
       * 审核类型 1视频 2课件
       */
      reviewType?: number;
      /**
       * 审核方式 1人工审核 2系统审核
       */
      reviewMethod?: number;
      /**
       * 审核时间
       */
      reviewTime?: string;
      /**
       * 审核人ID
       */
      reviewUserId?: number;
      /**
       * 审核人名称
       */
      reviewUserName?: string;
      /**
       * 审核状态
       */
      reviewStatus?: number;
      /**
       * 失败原因
       */
      reviewRemark?: string;
    }[];
    /**
     * 课件审核记录
     */
    liveSpeakerCoursewareReviewRecordList?: {
      /**
       * 审核记录id
       */
      id?: number;
      /**
       * 直播ID
       */
      liveId?: string;
      /**
       * 用户ID
       */
      userId?: string;
      /**
       * 讲者审核ID
       */
      liveSpeakerId?: string;
      /**
       * 课件Id
       */
      liveCoursewareId?: string;
      /**
       * 提交时间
       */
      submitTime?: string;
      /**
       * 提交人ID
       */
      submitUserId?: string;
      /**
       * 审核类型 1视频 2课件
       */
      reviewType?: number;
      /**
       * 审核方式 1人工审核 2系统审核
       */
      reviewMethod?: number;
      /**
       * 审核时间
       */
      reviewTime?: string;
      /**
       * 审核人ID
       */
      reviewUserId?: number;
      /**
       * 审核人名称
       */
      reviewUserName?: string;
      /**
       * 审核状态
       */
      reviewStatus?: number;
      /**
       * 失败原因
       */
      reviewRemark?: string;
    }[];
    /**
     * 是否可以驳回
     */
    isCanReject?: boolean & string;
    /**
     * 播客活动基础信息，只有播客场景有此对象
     */
    challengeBaseInfo?: {
      challengeId?: string;
      orgId?: string;
      fullOrgName?: string;
      title?: string;
      desc?: string;
      cover?: string;
      coverImg?: {
        imageName?: string;
        normal?: string;
        middle?: string;
        small?: string;
        gif?: string;
        nologo?: string;
      };
      tagId?: string;
      tagName?: string;
      strategyId?: string;
      strategyName?: string;
      startAt?: string;
      endAt?: string;
      startAtDate?: string;
      endAtDate?: string;
      challengeStatus?: number;
      challengeStatusDesc?: string;
      isSubmitted?: boolean;
      isApplied?: boolean;
      minVideoTime?: number;
      videoTimeConfig?: string;
      videoTimeConfigs?: string[];
      requirements?: string[];
      failReason?: string;
    };
    /**
     * 复审记录列表
     */
    liveReexamineRecordList?: {
      /**
       * 复审记录Id
       */
      liveReviewRecordId?: string;
      /**
       * 直播讲者审核id
       */
      liveSpeakerId?: string;
      /**
       * 任务标题
       */
      taskName?: string;
      /**
       * 任务复审截止时间
       */
      deadlineDate?: string;
      /**
       * 复审人员id
       */
      reviewUserId?: string;
      /**
       * 复审人员
       */
      reviewUserName?: string;
      /**
       * 复审状态 1审核中（进行中） 2成功（一致） 3失败（不一致）
       */
      status?: number;
      /**
       * 标签列表
       */
      tagList?: string;
      /**
       * 创建时间
       */
      createdAt?: string;
      /**
       * 备注
       */
      remark?: string;
    }[];
    /**
     * 视频相似结果
     */
    similarVideoResultVOList?: {
      videoId?: string;
      score?: number;
      similarKeyframeCompareVOList?: {
        originalSplitIndex?: number;
        similarSplitIndex?: number;
        similarKeyFrameUrl?: string;
        score?: number;
      }[];
      originalKeyframeResultVOList?: {
        splitIndex?: number;
        keyFrameUrl?: string;
      }[];
      similarKeyframeResultVOList?: {
        splitIndex?: number;
        keyFrameUrl?: string;
      }[];
    }[];
    /**
     * 课件信息
     */
    liveCourseware?: {
      coursewareId?: string;
      coursewareName?: string;
      coursewareUrl?: string;
    };
  };
}
